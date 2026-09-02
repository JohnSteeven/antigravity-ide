const crypto = require("crypto");
const http = require("http");
const { io: createClient } = require("socket.io-client");
const InMemoryRoomRepository = require("../multiplayer/persistence/InMemoryRoomRepository");
const { createMultiplayerPlatform } = require("../multiplayer/platform");
const { issueGuestToken } = require("../multiplayer/security/guestTokens");
const { attachMultiplayerSocketServer } = require("../multiplayer/realtime/socketServer");

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const [key, value] = argument.replace(/^--/, "").split("=");
  return [key, Number(value)];
}));
const roomCount = Math.max(1, Math.min(options.rooms || 6, 50));
const playersPerRoom = Math.max(2, Math.min(options.players || 6, 12));
const roundCount = Math.max(1, Math.min(options.rounds || 3, 8));

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
  let events = 0;
  let errors = 0;
  const startedAt = Date.now();

  const connect = (token) => new Promise((resolve, reject) => {
    const socket = createClient(endpoint, { auth: { token }, transports: ["websocket"], reconnection: false });
    clients.push(socket);
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });

  const emit = (socket, event, payload = {}) => new Promise((resolve, reject) => {
    const eventStartedAt = Date.now();
    socket.timeout(8000).emit(event, { requestId: crypto.randomUUID(), ...payload }, (timeoutError, response) => {
      latencies.push(Date.now() - eventStartedAt);
      events += 1;
      if (timeoutError || !response?.ok) {
        errors += 1;
        reject(timeoutError || new Error(response?.error?.message));
        return;
      }
      resolve(response);
    });
  });

  const scenarios = await Promise.all(Array.from({ length: roomCount }, async (_, roomIndex) => {
    const host = await platform.roomService.createRoom({
      gameKey: "who-knows-me-better",
      nickname: `Host ${roomIndex + 1}`,
    });
    const joined = [];
    for (let playerIndex = 1; playerIndex < playersPerRoom; playerIndex += 1) {
      joined.push(await platform.roomService.joinRoom({
        roomCode: host.room.roomCode,
        nickname: `P${roomIndex + 1}-${playerIndex}`,
      }));
    }
    const identities = [host, ...joined];
    const sockets = await Promise.all(identities.map((identity) => connect(issueGuestToken({
      roomId: identity.room._id,
      roomCode: identity.room.roomCode,
      playerId: identity.playerId,
    }))));
    return { host, sockets };
  }));

  await Promise.all(scenarios.map(async ({ host, sockets }) => {
    const hostSocket = sockets[0];
    const prepared = await emit(hostSocket, "host:prepare", {
      questionCount: roundCount,
      roundDurationSec: 10,
      categories: ["friendship", "playful", "everyday"],
    });
    const answers = Object.fromEntries(prepared.room.hostSetup.questions.map((question) => [question.id, question.choices[0].id]));
    await emit(hostSocket, "host:setup", { answers });
    let state = (await emit(hostSocket, "game:start")).room;

    for (let round = 0; round < roundCount; round += 1) {
      const question = state.round.question;
      await Promise.all(sockets.slice(1).map((socket) => emit(socket, "round:answer", {
        questionId: question.id,
        choiceId: question.choices[0].id,
      })));
      state = (await emit(hostSocket, "room:sync")).room;
      if (state.status !== "ROUND_REVEAL") throw new Error(`Expected reveal, received ${state.status}`);
      state = (await emit(hostSocket, "round:advance")).room;
      if (round < roundCount - 1) {
        const stored = await repository.findByCode(host.room.roomCode);
        const next = await platform.roomService.beginNextRound(stored);
        await runtime.broadcast(next.roomCode);
        state = (await emit(hostSocket, "room:sync")).room;
      }
    }
    if (state.status !== "FINISHED") throw new Error(`Expected finished, received ${state.status}`);
  }));

  const elapsedMs = Date.now() - startedAt;
  const report = {
    rooms: roomCount,
    clients: roomCount * playersPerRoom,
    roundsPerRoom: roundCount,
    acknowledgedEvents: events,
    errors,
    elapsedMs,
    eventLatencyMs: {
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
      max: Math.max(...latencies),
    },
    scope: "single-process Socket.IO transport and authoritative engine using the in-memory repository",
  };
  console.log(JSON.stringify(report, null, 2));

  clients.forEach((socket) => socket.disconnect());
  await runtime.close();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
};

run().catch((error) => {
  console.error(JSON.stringify({ error: error.message }));
  process.exit(1);
});
