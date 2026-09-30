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
const { listGames, getGame } = require("../../multiplayer/games/registry");
const { ERROR_CODES, PLAYER_ROLES, ROOM_STATUSES } = require("../../multiplayer/domain/constants");

jest.setTimeout(15000);

const emitAck = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));

describe("Phase 26 — Play Hub, Multi-Game Platform, and Privacy Isolation", () => {
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

  describe("1. Multiplayer Game Registry & Multi-Game Contract", () => {
    test("registry contains valid manifests for all active multiplayer games", () => {
      const games = listGames();
      expect(games.length).toBeGreaterThanOrEqual(2);

      const keys = games.map((g) => g.key);
      expect(keys).toContain("who-knows-me-better");
      expect(keys).toContain("life-auction");

      for (const manifest of games) {
        expect(manifest).toHaveProperty("key");
        expect(manifest).toHaveProperty("title");
        expect(manifest).toHaveProperty("version");
        expect(manifest.minPlayers).toBeGreaterThanOrEqual(2);
        expect(manifest.maxPlayers).toBeGreaterThanOrEqual(manifest.minPlayers);
      }
    });

    test("each registered game satisfies full engine interface", () => {
      for (const gameKey of ["who-knows-me-better", "life-auction"]) {
        const game = getGame(gameKey);
        expect(game).not.toBeNull();
        expect(typeof game.createRoomState).toBe("function");
        expect(typeof game.projectState).toBe("function");
        expect(typeof game.onRoundDeadline).toBe("function");
        expect(typeof game.onBetweenRoundDeadline).toBe("function");
        expect(typeof game.createGameRecord).toBe("function");
      }
    });

    test("unregistered game keys return null", () => {
      expect(getGame("fantasy-rpg")).toBeNull();
      expect(getGame("invalid-game")).toBeNull();
    });

    test("GET /api/multiplayer/games lists available games with categories", async () => {
      const res = await request(expressApp)
        .get("/api/multiplayer/games")
        .expect(200);

      expect(Array.isArray(res.body.games)).toBe(true);
      const keys = res.body.games.map((g) => g.key);
      expect(keys).toContain("who-knows-me-better");
      expect(keys).toContain("life-auction");
    });
  });

  describe("2. Room Creation Across Supported Games", () => {
    test("creates rooms with who-knows-me-better gameKey", async () => {
      const res = await request(expressApp)
        .post("/api/multiplayer/rooms")
        .send({ gameKey: "who-knows-me-better", nickname: "Maya" })
        .expect(201);

      expect(res.body.room.game.key).toBe("who-knows-me-better");
      expect(res.body.room.code).toMatch(/^MJ-[A-Z0-9]{4}$/);
      expect(res.body.token).toBeDefined();
    });

    test("creates rooms with life-auction gameKey", async () => {
      const res = await request(expressApp)
        .post("/api/multiplayer/rooms")
        .send({ gameKey: "life-auction", nickname: "Arjun" })
        .expect(201);

      expect(res.body.room.game.key).toBe("life-auction");
      expect(res.body.room.code).toMatch(/^MJ-[A-Z0-9]{4}$/);
      expect(res.body.token).toBeDefined();
    });

    test("rejects unknown gameKey with 400 Bad Request", async () => {
      const res = await request(expressApp)
        .post("/api/multiplayer/rooms")
        .send({ gameKey: "unknown-space-invaders", nickname: "Hacker" })
        .expect(400);

      expect(res.body.code).toBe(ERROR_CODES.BAD_REQUEST);
    });
  });

  describe("3. Party Game Switching Contract & Host Authority", () => {
    test("host cannot switch game while room is active, but can after FINISHED", async () => {
      // Create room with who-knows-me-better
      const createRes = await request(expressApp)
        .post("/api/multiplayer/rooms")
        .send({ gameKey: "who-knows-me-better", nickname: "HostPlayer" })
        .expect(201);
      const { room, token: hostToken } = createRes.body;

      // Join guest
      const joinRes = await request(expressApp)
        .post(`/api/multiplayer/rooms/${room.code}/join`)
        .send({ nickname: "GuestPlayer" })
        .expect(201);
      const guestToken = joinRes.body.token;

      // Connect sockets
      const hostSocket = await connectSocket(hostToken);
      const guestSocket = await connectSocket(guestToken);

      // Guest attempts to switch game -> rejected with NOT_HOST
      const guestSwitchRes = await emitAck(guestSocket, "party:switch-game", {
        requestId: crypto.randomUUID(),
        gameKey: "life-auction",
      });
      expect(guestSwitchRes.ok).toBe(false);
      expect(guestSwitchRes.error.code).toBe(ERROR_CODES.NOT_HOST);

      // Host attempts to switch game while in LOBBY -> rejected with INVALID_STATE
      const hostSwitchEarlyRes = await emitAck(hostSocket, "party:switch-game", {
        requestId: crypto.randomUUID(),
        gameKey: "life-auction",
      });
      expect(hostSwitchEarlyRes.ok).toBe(false);
      expect(hostSwitchEarlyRes.error.code).toBe(ERROR_CODES.INVALID_STATE);

      // Manually set room status to FINISHED in repository to verify switchGame behavior
      const currentRoom = await repository.findByCode(room.code);
      currentRoom.status = ROOM_STATUSES.FINISHED;
      await repository.save(currentRoom, currentRoom.version);

      // Host switches game to life-auction -> succeeds
      const hostSwitchSuccess = await emitAck(hostSocket, "party:switch-game", {
        requestId: crypto.randomUUID(),
        gameKey: "life-auction",
      });
      expect(hostSwitchSuccess.ok).toBe(true);
      expect(hostSwitchSuccess.room.game.key).toBe("life-auction");
      expect(hostSwitchSuccess.room.status).toBe(ROOM_STATUSES.READY);

      // Verify repository updated
      const updatedRoom = await repository.findByCode(room.code);
      expect(updatedRoom.gameKey).toBe("life-auction");
      expect(updatedRoom.status).toBe(ROOM_STATUSES.READY);
      // Both players are preserved in the room
      expect(updatedRoom.players.length).toBe(2);
    });
  });

  describe("4. Zero Private Life Intrusion & Isolation", () => {
    test("multiplayer guest tokens contain only room metadata and zero user credentials", () => {
      const token = issueGuestToken({
        roomId: "room_123",
        roomCode: "MJ-TEST",
        playerId: crypto.randomUUID(),
      });

      const payload = verifyGuestToken(token);
      expect(payload).toHaveProperty("roomCode", "MJ-TEST");
      expect(payload).toHaveProperty("playerId");
      expect(payload).toHaveProperty("kind", "guest-player");
      expect(payload).not.toHaveProperty("userId");
      expect(payload).not.toHaveProperty("email");
      expect(payload).not.toHaveProperty("lifeData");
      expect(payload).not.toHaveProperty("workspace");
    });

    test("serialized room payload contains zero references to private Life database models", async () => {
      const res = await request(expressApp)
        .post("/api/multiplayer/rooms")
        .send({ gameKey: "who-knows-me-better", nickname: "Tester" })
        .expect(201);

      const roomData = JSON.stringify(res.body);
      expect(roomData).not.toContain("LifeEntry");
      expect(roomData).not.toContain("LifeDay");
      expect(roomData).not.toContain("LifeMilestone");
      expect(roomData).not.toContain("privateNotes");
    });
  });
});
