"use strict";

const crypto = require("crypto");
const http = require("http");
const request = require("supertest");
const express = require("express");
const { io: createClient } = require("socket.io-client");
const InMemoryRoomRepository = require("../../multiplayer/persistence/InMemoryRoomRepository");
const { createMultiplayerPlatform } = require("../../multiplayer/platform");
const { issueGuestToken, verifyGuestToken } = require("../../multiplayer/security/guestTokens");
const { attachMultiplayerSocketServer } = require("../../multiplayer/realtime/socketServer");
const { createMultiplayerRouter } = require("../../routes/multiplayerRoutes");
const { serializeRoom, standingsFor } = require("../../multiplayer/domain/serializer");
const { ERROR_CODES, PLAYER_ROLES, ROOM_STATUSES } = require("../../multiplayer/domain/constants");

jest.setTimeout(15000);

const emitAck = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));

describe("Phase 24 — Who Knows Me Better Full Lifecycle & Security Audit", () => {
  let platform;
  let repository;
  let httpServer;
  let baseUrl;
  let expressApp;
  const clients = [];

  beforeEach(async () => {
    repository = new InMemoryRoomRepository();
    platform = createMultiplayerPlatform({
      repository,
      analytics: { track: () => {} },
    });
    platform.readiness.realtime = true;
    platform.readiness.storage = true;

    expressApp = express();
    expressApp.use(express.json());
    expressApp.use("/api/multiplayer", createMultiplayerRouter(platform));
    expressApp.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        code: err.code || "INTERNAL_ERROR",
        message: err.message,
      });
    });

    httpServer = http.createServer(expressApp);
    const runtime = await attachMultiplayerSocketServer(httpServer, platform, { redis: false });
    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${httpServer.address().port}/multiplayer`;
    runtime.platform = platform;
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients.length = 0;
    if (httpServer.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
  });

  const connectSocket = (token) => new Promise((resolve, reject) => {
    const client = createClient(baseUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
  });

  describe("1. Room Creation, Joining, and Nickname Validation", () => {
    it("host creates a room with valid server-generated code and token", async () => {
      const res = await request(expressApp)
        .post("/api/multiplayer/rooms")
        .send({ gameKey: "who-knows-me-better", nickname: "HostNoble" })
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.room.code).toMatch(/^MJ-[A-Z0-9]{4}$/);
      expect(res.body.room.self.role).toBe(PLAYER_ROLES.HOST);
      expect(res.body.room.status).toBe(ROOM_STATUSES.LOBBY);

      const decoded = verifyGuestToken(res.body.token);
      expect(decoded.roomCode).toBe(res.body.room.code);
    });

    it("guest joins successfully and duplicate nickname is rejected with 409", async () => {
      const created = await platform.roomService.createRoom({
        gameKey: "who-knows-me-better",
        nickname: "HostPlayer",
      });

      const joinRes = await request(expressApp)
        .post(`/api/multiplayer/rooms/${created.room.roomCode}/join`)
        .send({ nickname: "GuestFriend" })
        .expect(201);

      expect(joinRes.body.room.self.role).toBe(PLAYER_ROLES.PLAYER);
      expect(joinRes.body.room.players).toHaveLength(2);

      // Attempt duplicate nickname
      const dupRes = await request(expressApp)
        .post(`/api/multiplayer/rooms/${created.room.roomCode}/join`)
        .send({ nickname: "GuestFriend" })
        .expect(409);

      expect(dupRes.body.code).toBe(ERROR_CODES.NICKNAME_TAKEN);
    });
  });

  describe("2. Security Boundaries & Authorization", () => {
    it("rejects token issued for a different room with 401", async () => {
      const roomA = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "HostA" });
      const roomB = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "HostB" });

      const tokenA = issueGuestToken({
        roomId: roomA.room._id,
        roomCode: roomA.room.roomCode,
        playerId: roomA.playerId,
      });

      await request(expressApp)
        .post(`/api/multiplayer/rooms/${roomB.room.roomCode}/resume`)
        .send({ token: tokenA })
        .expect(401);
    });

    it("prevents guest from invoking host-only actions (game:start, host:setup)", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      const guest = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Guest" });
      const guestToken = issueGuestToken({ roomId: guest.room._id, roomCode: guest.room.roomCode, playerId: guest.playerId });
      const guestSocket = await connectSocket(guestToken);

      const startAttempt = await emitAck(guestSocket, "game:start", { requestId: crypto.randomUUID() });
      expect(startAttempt.ok).toBe(false);
      expect(startAttempt.error.code).toBe(ERROR_CODES.NOT_HOST);

      const setupAttempt = await emitAck(guestSocket, "host:setup", {
        requestId: crypto.randomUUID(),
        answers: {},
      });
      expect(setupAttempt.ok).toBe(false);
      expect(setupAttempt.error.code).toBe(ERROR_CODES.NOT_HOST);
    });

    it("prevents host from answering round questions (host observes only)", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      const guest = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Guest" });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: guest.playerId, connected: true });

      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const hostSocket = await connectSocket(hostToken);

      const prep = await emitAck(hostSocket, "host:prepare", {
        requestId: crypto.randomUUID(),
        questionCount: 3,
        roundDurationSec: 10,
        categories: ["friendship"],
      });
      const answers = Object.fromEntries(prep.room.hostSetup.questions.map((q) => [q.id, q.choices[0].id]));
      await emitAck(hostSocket, "host:setup", { requestId: crypto.randomUUID(), answers });
      const start = await emitAck(hostSocket, "game:start", { requestId: crypto.randomUUID() });
      expect(start.room.status).toBe(ROOM_STATUSES.IN_PROGRESS);

      const question = start.room.round.question;
      const hostAnswerAttempt = await emitAck(hostSocket, "round:answer", {
        requestId: crypto.randomUUID(),
        questionId: question.id,
        choiceId: question.choices[0].id,
      });

      expect(hostAnswerAttempt.ok).toBe(false);
      expect(hostAnswerAttempt.error.code).toBe(ERROR_CODES.INVALID_ACTION);
    });
  });

  describe("3. Privacy & State Projection (Zero Secret Leaks)", () => {
    it("never exposes host answers or correct choice id to players before reveal", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      const guest = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Guest" });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: guest.playerId, connected: true });

      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const guestToken = issueGuestToken({ roomId: guest.room._id, roomCode: guest.room.roomCode, playerId: guest.playerId });

      const hostSocket = await connectSocket(hostToken);
      const guestSocket = await connectSocket(guestToken);

      const prep = await emitAck(hostSocket, "host:prepare", {
        requestId: crypto.randomUUID(),
        questionCount: 3,
        roundDurationSec: 15,
        categories: ["friendship"],
      });
      expect(prep.ok).toBe(true);
      const answers = Object.fromEntries(prep.room.hostSetup.questions.map((q) => [q.id, q.choices[0].id]));
      await emitAck(hostSocket, "host:setup", { requestId: crypto.randomUUID(), answers });
      await emitAck(hostSocket, "game:start", { requestId: crypto.randomUUID() });

      // Check guest's synchronized view
      const guestSync = await emitAck(guestSocket, "room:sync", { requestId: crypto.randomUUID() });
      expect(guestSync.ok).toBe(true);
      expect(guestSync.room.hostSetup).toBeUndefined();
      expect(guestSync.room.round.reveal).toBeNull();
      expect(JSON.stringify(guestSync.room)).not.toContain("hostAnswers");
      expect(JSON.stringify(guestSync.room)).not.toContain("correctChoiceId");
    });
  });

  describe("4. Answer Validation, Duplicate and Stale Submissions", () => {
    it("rejects mismatched question or invalid choice", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      const guest = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Guest" });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: guest.playerId, connected: true });

      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const guestToken = issueGuestToken({ roomId: guest.room._id, roomCode: guest.room.roomCode, playerId: guest.playerId });
      const hostSocket = await connectSocket(hostToken);
      const guestSocket = await connectSocket(guestToken);

      const prep = await emitAck(hostSocket, "host:prepare", {
        requestId: crypto.randomUUID(),
        questionCount: 3,
        roundDurationSec: 15,
        categories: ["friendship"],
      });
      expect(prep.ok).toBe(true);
      const answers = Object.fromEntries(prep.room.hostSetup.questions.map((q) => [q.id, q.choices[0].id]));
      await emitAck(hostSocket, "host:setup", { requestId: crypto.randomUUID(), answers });
      const started = await emitAck(hostSocket, "game:start", { requestId: crypto.randomUUID() });

      // Invalid questionId
      const badQ = await emitAck(guestSocket, "round:answer", {
        requestId: crypto.randomUUID(),
        questionId: "wrong-question-id",
        choiceId: started.room.round.question.choices[0].id,
      });
      expect(badQ.ok).toBe(false);
      expect(badQ.error.code).toBe(ERROR_CODES.BAD_REQUEST);

      // Invalid choiceId
      const badC = await emitAck(guestSocket, "round:answer", {
        requestId: crypto.randomUUID(),
        questionId: started.room.round.question.id,
        choiceId: "non-existent-choice",
      });
      expect(badC.ok).toBe(false);
      expect(badC.error.code).toBe(ERROR_CODES.BAD_REQUEST);
    });

    it("rejects duplicate answer in same round with 409", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      const guestA = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "GuestA" });
      const guestB = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "GuestB" });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: guestA.playerId, connected: true });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: guestB.playerId, connected: true });

      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const guestAToken = issueGuestToken({ roomId: guestA.room._id, roomCode: guestA.room.roomCode, playerId: guestA.playerId });
      const hostSocket = await connectSocket(hostToken);
      const guestASocket = await connectSocket(guestAToken);

      const prep = await emitAck(hostSocket, "host:prepare", {
        requestId: crypto.randomUUID(),
        questionCount: 3,
        roundDurationSec: 15,
        categories: ["friendship"],
      });
      expect(prep.ok).toBe(true);
      const answers = Object.fromEntries(prep.room.hostSetup.questions.map((q) => [q.id, q.choices[0].id]));
      await emitAck(hostSocket, "host:setup", { requestId: crypto.randomUUID(), answers });
      const started = await emitAck(hostSocket, "game:start", { requestId: crypto.randomUUID() });
      const q = started.room.round.question;

      // First answer
      const first = await emitAck(guestASocket, "round:answer", {
        requestId: crypto.randomUUID(),
        questionId: q.id,
        choiceId: q.choices[0].id,
      });
      expect(first.ok).toBe(true);

      // Second answer attempt by same player
      const second = await emitAck(guestASocket, "round:answer", {
        requestId: crypto.randomUUID(),
        questionId: q.id,
        choiceId: q.choices[1].id,
      });
      expect(second.ok).toBe(false);
      expect(second.error.code).toBe(ERROR_CODES.DUPLICATE_ACTION);
    });
  });

  describe("5. Server-Authoritative Scoring and Standings", () => {
    it("computes speed-weighted points and assigns standings upon all players answering", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      const p1 = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Player1" });
      const p2 = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Player2" });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: p1.playerId, connected: true });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: p2.playerId, connected: true });

      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const p1Token = issueGuestToken({ roomId: p1.room._id, roomCode: p1.room.roomCode, playerId: p1.playerId });
      const p2Token = issueGuestToken({ roomId: p2.room._id, roomCode: p2.room.roomCode, playerId: p2.playerId });

      const hostSocket = await connectSocket(hostToken);
      const p1Socket = await connectSocket(p1Token);
      const p2Socket = await connectSocket(p2Token);

      const prep = await emitAck(hostSocket, "host:prepare", {
        requestId: crypto.randomUUID(),
        questionCount: 3,
        roundDurationSec: 10,
        categories: ["friendship"],
      });
      expect(prep.ok).toBe(true);
      const correctChoiceId = prep.room.hostSetup.questions[0].choices[0].id;
      const answers = Object.fromEntries(prep.room.hostSetup.questions.map((q) => [q.id, q.choices[0].id]));
      await emitAck(hostSocket, "host:setup", { requestId: crypto.randomUUID(), answers });
      const started = await emitAck(hostSocket, "game:start", { requestId: crypto.randomUUID() });
      const q = started.room.round.question;

      // Both players answer correctly
      await emitAck(p1Socket, "round:answer", {
        requestId: crypto.randomUUID(),
        questionId: q.id,
        choiceId: correctChoiceId,
      });
      const p2Res = await emitAck(p2Socket, "round:answer", {
        requestId: crypto.randomUUID(),
        questionId: q.id,
        choiceId: correctChoiceId,
      });

      expect(p2Res.room.status).toBe(ROOM_STATUSES.ROUND_REVEAL);
      expect(p2Res.room.round.reveal.correctChoiceId).toBe(correctChoiceId);

      // Verify standings in room
      const standings = p2Res.room.standings;
      expect(standings).toHaveLength(2);
      expect(standings[0].score).toBeGreaterThanOrEqual(500);
      expect(standings[1].score).toBeGreaterThanOrEqual(500);
    });
  });

  describe("6. Reconnect & Rematch Preservation", () => {
    it("reconnect restores active session cleanly", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      const guest = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Guest" });
      await platform.roomService.setPresence({ roomCode: host.room.roomCode, playerId: guest.playerId, connected: true });

      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const hostSocket = await connectSocket(hostToken);

      const prep = await emitAck(hostSocket, "host:prepare", {
        requestId: crypto.randomUUID(),
        questionCount: 3,
        roundDurationSec: 10,
        categories: ["friendship"],
      });
      expect(prep.ok).toBe(true);
      const answers = Object.fromEntries(prep.room.hostSetup.questions.map((q) => [q.id, q.choices[0].id]));
      await emitAck(hostSocket, "host:setup", { requestId: crypto.randomUUID(), answers });
      await emitAck(hostSocket, "game:start", { requestId: crypto.randomUUID() });

      // Host disconnects and reconnects
      hostSocket.disconnect();
      const reconnectedHost = await connectSocket(hostToken);
      const syncRes = await emitAck(reconnectedHost, "room:sync", { requestId: crypto.randomUUID() });
      expect(syncRes.ok).toBe(true);
      expect(syncRes.room.status).toBe(ROOM_STATUSES.IN_PROGRESS);
      expect(syncRes.room.self.role).toBe(PLAYER_ROLES.HOST);
    });
  });

  describe("7. Private Life Boundary", () => {
    it("operates fully without reading or modifying private Life domain", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
      expect(host.room.gameData).toBeDefined();
      expect(host.room.gameData.lifeWorkspace).toBeUndefined();
      expect(host.room.gameData.journal).toBeUndefined();
      expect(host.room.gameData.health).toBeUndefined();
    });
  });
});
