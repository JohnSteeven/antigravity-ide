const crypto = require("crypto");
const http = require("http");
const { io: createClient } = require("socket.io-client");
const InMemoryRoomRepository = require("../multiplayer/persistence/InMemoryRoomRepository");
const { createMultiplayerPlatform } = require("../multiplayer/platform");
const { issueGuestToken } = require("../multiplayer/security/guestTokens");
const { attachMultiplayerSocketServer } = require("../multiplayer/realtime/socketServer");

const rawOptions = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, value] = argument.replace(/^--/, "").split("=");
  return [key, value];
}));
const roomCount = Math.max(1, Math.min(Number(rawOptions.rooms || 4), 50));
const playersPerRoom = Math.max(2, Math.min(Number(rawOptions.players || 6), 12));
const lotCount = Math.max(1, Math.min(Number(rawOptions.lots || 8), 8));

const percentile = (values, ratio) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
};

const run = async () => {
  const repository = new InMemoryRoomRepository();
  const platform = createMultiplayerPlatform({ repository, analytics: null });
  const server = http.createServer();
  const runtime = await attachMultiplayerSocketServer(server, platform, { redis: false });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/multiplayer`;
  const clients = [];
  const latencies = [];
  const cpuStart = process.cpuUsage();
  const memoryStart = process.memoryUsage().heapUsed;
  let events = 0;
  let errors = 0;
  let acceptedBids = 0;
  let rejectedBids = 0;
  let extensions = 0;
  let reconnects = 0;
  const startedAt = Date.now();

  const connect = (token) => new Promise((resolve, reject) => {
    const socket = createClient(endpoint, { auth: { token }, transports: ["websocket"], reconnection: false });
    clients.push(socket);
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });

  const emit = (socket, event, payload = {}, { expectedRejection = false } = {}) => new Promise((resolve, reject) => {
    const eventStartedAt = Date.now();
    socket.timeout(8000).emit(event, { requestId: crypto.randomUUID(), ...payload }, (timeoutError, response) => {
      latencies.push(Date.now() - eventStartedAt);
      events += 1;
      if (timeoutError || !response?.ok) {
        if (!expectedRejection) errors += 1;
        if (expectedRejection) resolve(response);
        else reject(timeoutError || new Error(response?.error?.message));
        return;
      }
      resolve(response);
    });
  });

  const gameCommand = (socket, command, payload = {}, options) => emit(socket, "game:command", { command, payload }, options);

  const scenarios = await Promise.all(Array.from({ length: roomCount }, async (_, roomIndex) => {
    const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: `Host ${roomIndex + 1}` });
    const identities = [host];
    for (let playerIndex = 1; playerIndex < playersPerRoom; playerIndex += 1) {
      identities.push(await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: `P${roomIndex + 1}-${playerIndex}` }));
    }
    const tokens = identities.map((identity) => issueGuestToken({ roomId: identity.room._id, roomCode: identity.room.roomCode, playerId: identity.playerId }));
    const sockets = await Promise.all(tokens.map(connect));
    return { host, identities, tokens, sockets };
  }));

  await Promise.all(scenarios.map(async (scenario, scenarioIndex) => {
    const { host, sockets, tokens } = scenario;
    await gameCommand(sockets[0], "setup:update", { modeKey: scenarioIndex % 2 ? "chaos" : "classic-life", lengthKey: "quick", startingCoins: 100 });
    let state = (await gameCommand(sockets[0], "session:start", {})).room;

    for (let lotIndex = 0; lotIndex < lotCount; lotIndex += 1) {
      if (state.lifeAuction.phase === "LIFE_EVENT") {
        const active = state.lifeAuction.event;
        if (active.choiceRequired) {
          await Promise.all(sockets.map((socket, playerIndex) => {
            const choice = active.choices.find((entry) => entry.id !== "gift") || active.choices[0];
            const payload = { choiceId: choice.id };
            if (choice.id === "gift") payload.targetPlayerId = scenario.identities[(playerIndex + 1) % scenario.identities.length].playerId;
            return gameCommand(socket, "life_event:choose", payload);
          }));
        } else {
          const storedEvent = await repository.findByCode(host.room.roomCode);
          await platform.roomService.expireRound(storedEvent);
          await runtime.broadcast(host.room.roomCode);
        }
        const eventReveal = await repository.findByCode(host.room.roomCode);
        await platform.roomService.beginNextRound(eventReveal);
        await runtime.broadcast(host.room.roomCode);
        state = (await emit(sockets[0], "room:sync")).room;
      }

      const auction = state.lifeAuction.auction;
      if (!auction || state.status !== "IN_PROGRESS") break;
      if (auction.type === "OPEN_ASCENDING") {
        const stored = await repository.findByCode(host.room.roomCode);
        stored.gameData.state.currentAuction.deadline = new Date(Date.now() + 150).toISOString();
        stored.gameData.roundDeadline = new Date(stored.gameData.state.currentAuction.deadline);
        await repository.save(stored, stored.version);
        const minimum = auction.minimumNextBid;
        const burst = await Promise.all(sockets.map((socket, playerIndex) => gameCommand(
          socket,
          "auction:bid",
          { amount: minimum + playerIndex * auction.minimumIncrement },
          { expectedRejection: true }
        )));
        acceptedBids += burst.filter((response) => response?.ok).length;
        rejectedBids += burst.filter((response) => !response?.ok).length;
        const afterBurst = await repository.findByCode(host.room.roomCode);
        extensions += afterBurst.gameData.state.currentAuction.extensionCount;
      } else if (auction.type === "SEALED_BID") {
        const burst = await Promise.all(sockets.map((socket, playerIndex) => {
          const balance = state.lifeAuction.players[playerIndex]?.balance || 0;
          if (balance < 1) return Promise.resolve(null);
          return gameCommand(socket, "auction:bid", { amount: Math.min(balance, 90, auction.startingPrice + playerIndex + 2) });
        }));
        const submitted = burst.filter(Boolean);
        acceptedBids += submitted.length;
      } else {
        const burst = await Promise.all(sockets.map((socket) => gameCommand(socket, "auction:bid", { amount: auction.price }, { expectedRejection: true })));
        acceptedBids += burst.filter((response) => response?.ok).length;
        rejectedBids += burst.filter((response) => !response?.ok).length;
      }

      let stored = await repository.findByCode(host.room.roomCode);
      if (stored.status === "IN_PROGRESS") {
        await platform.roomService.expireRound(stored);
        await runtime.broadcast(host.room.roomCode);
        stored = await repository.findByCode(host.room.roomCode);
      }
      if (stored.status === "ROUND_REVEAL") {
        await platform.roomService.beginNextRound(stored);
        await runtime.broadcast(host.room.roomCode);
      }
      state = (await emit(sockets[0], "room:sync")).room;

      if (lotIndex === Math.floor(lotCount / 2) - 1 && sockets.length > 2) {
        sockets[1].disconnect();
        await new Promise((resolve) => setTimeout(resolve, 5));
        sockets[1] = await connect(tokens[1]);
        reconnects += 1;
        state = (await emit(sockets[1], "room:sync")).room;
      }
    }
  }));

  const elapsedMs = Date.now() - startedAt;
  const cpu = process.cpuUsage(cpuStart);
  const memoryEnd = process.memoryUsage().heapUsed;
  const finishedRooms = (await Promise.all(scenarios.map((scenario) => repository.findByCode(scenario.host.room.roomCode))))
    .filter((room) => room.status === "FINISHED").length;
  const report = {
    rooms: roomCount,
    clients: roomCount * playersPerRoom,
    lotsRequestedPerRoom: lotCount,
    completedRooms: finishedRooms,
    acknowledgedEvents: events,
    eventsPerSecond: elapsedMs ? Number((events / (elapsedMs / 1000)).toFixed(2)) : 0,
    acceptedBids,
    acceptedBidsPerSecond: elapsedMs ? Number((acceptedBids / (elapsedMs / 1000)).toFixed(2)) : 0,
    rejectedBids,
    antiSnipingExtensions: extensions,
    reconnects,
    errors,
    elapsedMs,
    eventLatencyMs: {
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
      max: Math.max(...latencies, 0),
    },
    process: {
      cpuUserMs: Math.round(cpu.user / 1000),
      cpuSystemMs: Math.round(cpu.system / 1000),
      heapDeltaMb: Number(((memoryEnd - memoryStart) / 1048576).toFixed(2)),
      heapUsedMb: Number((memoryEnd / 1048576).toFixed(2)),
    },
    storage: {
      authority: "isolated in-memory compare-and-swap repository",
      databaseUtilization: "not measured",
      redisUtilization: "not measured",
    },
    scope: "single-process real Socket.IO clients, authoritative Life Auction engine, bid bursts, anti-sniping, sealed submissions, events and reconnects",
  };
  console.log(JSON.stringify(report, null, 2));

  clients.forEach((socket) => socket.disconnect());
  await runtime.close();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
};

run().catch((error) => {
  console.error(JSON.stringify({ error: error.message, stack: error.stack }));
  process.exit(1);
});
