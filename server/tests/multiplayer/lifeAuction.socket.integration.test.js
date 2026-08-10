const crypto = require("crypto");
const http = require("http");
const { io: createClient } = require("socket.io-client");
const InMemoryRoomRepository = require("../../multiplayer/persistence/InMemoryRoomRepository");
const { createMultiplayerPlatform } = require("../../multiplayer/platform");
const { issueGuestToken } = require("../../multiplayer/security/guestTokens");
const { attachMultiplayerSocketServer } = require("../../multiplayer/realtime/socketServer");

jest.setTimeout(15000);

const emitAck = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));
const gameCommand = (socket, command, payload = {}) => emitAck(socket, "game:command", { requestId: crypto.randomUUID(), command, payload });

describe("Life Auction realtime protocol", () => {
  let runtime;
  let httpServer;
  let baseUrl;
  const clients = [];

  beforeEach(async () => {
    const repository = new InMemoryRoomRepository();
    const platform = createMultiplayerPlatform({ repository, analytics: null });
    httpServer = http.createServer();
    runtime = await attachMultiplayerSocketServer(httpServer, platform, { redis: false });
    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${httpServer.address().port}/multiplayer`;
    runtime.platform = platform;
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients.length = 0;
    await runtime.close();
    if (httpServer.listening) await new Promise((resolve) => httpServer.close(resolve));
  });

  const connect = (token) => new Promise((resolve, reject) => {
    const client = createClient(baseUrl, { auth: { token }, transports: ["websocket"], reconnection: false });
    clients.push(client);
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
  });

  const createParty = async (count = 2) => {
    const platform = runtime.platform;
    const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
    const members = [host];
    for (let index = 1; index < count; index += 1) {
      members.push(await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: `Friend ${index}` }));
    }
    const sockets = await Promise.all(members.map((member) => connect(issueGuestToken({
      roomId: member.room._id,
      roomCode: member.room.roomCode,
      playerId: member.playerId,
    }))));
    await gameCommand(sockets[0], "setup:update", { modeKey: "classic-life", lengthKey: "quick", startingCoins: 100 });
    const started = await gameCommand(sockets[0], "session:start", {});
    expect(started.ok).toBe(true);
    return { host, members, sockets, started };
  };

  test("serializes competing socket bids through one authoritative room version", async () => {
    const { sockets, started } = await createParty(2);
    const amount = started.room.lifeAuction.auction.startingPrice;
    const responses = await Promise.all([
      gameCommand(sockets[0], "auction:bid", { amount }),
      gameCommand(sockets[1], "auction:bid", { amount }),
    ]);
    expect(responses.filter((response) => response.ok)).toHaveLength(1);
    expect(responses.filter((response) => !response.ok)).toHaveLength(1);
    const sync = await emitAck(sockets[0], "room:sync", { requestId: crypto.randomUUID() });
    expect(sync.room.lifeAuction.auction.bidHistory).toHaveLength(1);
    expect(sync.room.lifeAuction.players.filter((player) => player.balance === 100)).toHaveLength(2);
  });

  test("keeps sealed bids private through fanout and reconnect until every player submits", async () => {
    const { host, members, sockets } = await createParty(3);
    let room = await runtime.platform.repository.findByCode(host.room.roomCode);
    room.gameData.state.currentAuction.type = "SEALED_BID";
    room.gameData.state.currentAuction.visibility = "PRIVATE_UNTIL_REVEAL";
    room.gameData.state.currentAuction.highestBid = null;
    room.gameData.state.currentAuction.bidHistory = [];
    room.gameData.state.currentAuction.sealedBids = {};
    room.gameData.state.plan.lots[0].auction.type = "SEALED_BID";
    room = await runtime.platform.repository.save(room, room.version);
    await runtime.broadcast(room.roomCode);

    expect((await gameCommand(sockets[0], "auction:bid", { amount: 27 })).ok).toBe(true);
    expect((await gameCommand(sockets[1], "auction:bid", { amount: 18 })).ok).toBe(true);
    const thirdView = await emitAck(sockets[2], "room:sync", { requestId: crypto.randomUUID() });
    expect(JSON.stringify(thirdView.room)).not.toContain('"amount":27');
    expect(JSON.stringify(thirdView.room)).not.toContain('"amount":18');
    expect(thirdView.room.lifeAuction.auction.submittedPlayerIds).toHaveLength(2);

    sockets[1].disconnect();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const replacement = await connect(issueGuestToken({ roomId: members[1].room._id, roomCode: members[1].room.roomCode, playerId: members[1].playerId }));
    const restored = await emitAck(replacement, "room:sync", { requestId: crypto.randomUUID() });
    expect(restored.room.lifeAuction.auction.ownBidSubmitted).toBe(true);
    expect(restored.room.lifeAuction.wallet.reserved).toBeNull();
    expect(JSON.stringify(restored.room)).not.toContain('"amount":18');

    const revealed = await gameCommand(sockets[2], "auction:bid", { amount: 12 });
    expect(revealed.room.status).toBe("ROUND_REVEAL");
    expect(revealed.room.lifeAuction.result.bids.map((bid) => bid.amount)).toEqual([27, 18, 12]);
  });
});
