const crypto = require("crypto");
const http = require("http");
const { io: createClient } = require("socket.io-client");
const InMemoryRoomRepository = require("../../multiplayer/persistence/InMemoryRoomRepository");
const { createMultiplayerPlatform } = require("../../multiplayer/platform");
const { issueGuestToken } = require("../../multiplayer/security/guestTokens");
const { attachMultiplayerSocketServer } = require("../../multiplayer/realtime/socketServer");

jest.setTimeout(15000);

const emitAck = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));

describe("multiplayer Socket.IO protocol", () => {
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

  test("two real clients receive synchronized state without leaking host answers", async () => {
    const platform = runtime.platform;
    const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
    const friend = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });
    const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
    const friendToken = issueGuestToken({ roomId: friend.room._id, roomCode: friend.room.roomCode, playerId: friend.playerId });
    const [hostSocket, friendSocket] = await Promise.all([connect(hostToken), connect(friendToken)]);

    const prepared = await emitAck(hostSocket, "host:prepare", {
      requestId: crypto.randomUUID(),
      questionCount: 3,
      roundDurationSec: 10,
      categories: ["friendship"],
    });
    expect(prepared.ok).toBe(true);
    const answers = Object.fromEntries(prepared.room.hostSetup.questions.map((question) => [question.id, question.choices[0].id]));
    const setup = await emitAck(hostSocket, "host:setup", { requestId: crypto.randomUUID(), answers });
    expect(setup.room.status).toBe("READY");

    const started = await emitAck(hostSocket, "game:start", { requestId: crypto.randomUUID() });
    expect(started.room.status).toBe("IN_PROGRESS");
    const friendState = await emitAck(friendSocket, "room:sync", { requestId: crypto.randomUUID() });
    expect(friendState.ok).toBe(true);
    expect(friendState.room.hostSetup).toBeUndefined();
    expect(friendState.room.round.reveal).toBeNull();
    expect(JSON.stringify(friendState.room)).not.toContain("hostAnswers");

    const answer = await emitAck(friendSocket, "round:answer", {
      requestId: crypto.randomUUID(),
      questionId: friendState.room.round.question.id,
      choiceId: friendState.room.round.question.choices[0].id,
    });
    expect(answer.ok).toBe(true);
    expect(answer.room.status).toBe("ROUND_REVEAL");
    expect(answer.room.round.reveal.correctChoiceId).toBe(friendState.room.round.question.choices[0].id);
  });

  test("rejects forged tokens and malformed event payloads", async () => {
    const rejected = createClient(baseUrl, { auth: { token: "forged" }, transports: ["websocket"], reconnection: false });
    clients.push(rejected);
    const error = await new Promise((resolve) => rejected.once("connect_error", resolve));
    expect(error.data.code).toBe("MULTIPLAYER_INVALID_TOKEN");

    const platform = runtime.platform;
    const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
    const token = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
    const socket = await connect(token);
    const response = await emitAck(socket, "game:start", { requestId: "not-a-uuid", extra: true });
    expect(response.ok).toBe(false);
    expect(response.error.code).toBe("MULTIPLAYER_BAD_REQUEST");
  });

  test("reconnects the same player identity after a dropped socket", async () => {
    const platform = runtime.platform;
    const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
    const token = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
    const firstSocket = await connect(token);
    const before = await emitAck(firstSocket, "room:sync", { requestId: crypto.randomUUID() });
    firstSocket.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 25));

    const reconnected = await connect(token);
    const after = await emitAck(reconnected, "room:sync", { requestId: crypto.randomUUID() });
    expect(after.ok).toBe(true);
    expect(after.room.self.id).toBe(before.room.self.id);
    expect(after.room.code).toBe(before.room.code);
    expect(after.room.self.connected).toBe(true);
  });
});
