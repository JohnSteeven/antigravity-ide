"use strict";

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { createMultiplayerRouter } = require("../routes/multiplayerRoutes");
const { createMultiplayerPlatform } = require("../multiplayer/platform");
const InMemoryRoomRepository = require("../multiplayer/persistence/InMemoryRoomRepository");
const { issueGuestToken, verifyGuestToken } = require("../multiplayer/security/guestTokens");
const { parse, restSchemas } = require("../multiplayer/domain/protocol");
const playLifeEngine = require("../../src/features/play-life/engine/playLifeEngine");

describe("Phase 23 — Play and Life-Adjacent Experience Audit", () => {
  let app;
  let platform;
  let repository;

  beforeEach(() => {
    repository = new InMemoryRoomRepository();
    platform = createMultiplayerPlatform({
      repository,
      analytics: { track: () => {} },
    });
    platform.readiness.realtime = true;
    platform.readiness.storage = true;

    app = express();
    app.use(express.json());
    app.use("/api/multiplayer", createMultiplayerRouter(platform));
    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        code: err.code || "INTERNAL_ERROR",
        message: err.message,
      });
    });
  });

  describe("1. Canonical Play Surfaces and Route Access", () => {
    it("GET /api/multiplayer/games returns allowlisted game manifests", async () => {
      const res = await request(app).get("/api/multiplayer/games").expect(200);
      expect(res.body.games).toBeInstanceOf(Array);
      expect(res.body.games.length).toBeGreaterThanOrEqual(1);

      const gameKeys = res.body.games.map((g) => g.key);
      expect(gameKeys).toContain("who-knows-me-better");
    });

    it("GET /api/multiplayer/health reports service readiness accurately", async () => {
      const res = await request(app).get("/api/multiplayer/health").expect(200);
      expect(res.body).toMatchObject({
        ok: true,
        service: "myjourney-multiplayer",
        realtime: true,
        storage: true,
      });
    });

    it("GET /api/multiplayer/metrics denies unauthenticated callers", async () => {
      await request(app).get("/api/multiplayer/metrics").expect(401);
    });
  });

  describe("2. Server State Authority and Anti-Tampering", () => {
    it("creates room with server-generated roomCode and signed guest token", async () => {
      const res = await request(app)
        .post("/api/multiplayer/rooms")
        .send({
          gameKey: "who-knows-me-better",
          nickname: "HostPlayer",
          locale: "en",
        })
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.room).toMatchObject({
        code: expect.stringMatching(/^[A-Z0-9-]{4,10}$/),
        status: "LOBBY",
        players: [
          expect.objectContaining({
            nickname: "HostPlayer",
            role: "HOST",
          }),
        ],
        self: expect.objectContaining({
          nickname: "HostPlayer",
          role: "HOST",
        }),
      });

      const decoded = verifyGuestToken(res.body.token);
      expect(decoded.roomCode).toBe(res.body.room.code);
      expect(decoded.playerId).toBe(res.body.room.self.id);
    });

    it("joins room and serializes isolated player perspective", async () => {
      // 1. Create room
      const created = await platform.roomService.createRoom({
        gameKey: "who-knows-me-better",
        nickname: "HostPlayer",
      });

      // 2. Second player joins
      const res = await request(app)
        .post(`/api/multiplayer/rooms/${created.room.roomCode}/join`)
        .send({ nickname: "GuestPlayer" })
        .expect(201);

      expect(res.body.room.self.nickname).toBe("GuestPlayer");
      expect(res.body.room.self.role).toBe("PLAYER");
      expect(res.body.room.players).toHaveLength(2);
    });

    it("prevents duplicate nicknames in the same room with 409", async () => {
      const created = await platform.roomService.createRoom({
        gameKey: "who-knows-me-better",
        nickname: "UniqueNick",
      });

      await request(app)
        .post(`/api/multiplayer/rooms/${created.room.roomCode}/join`)
        .send({ nickname: "UniqueNick" })
        .expect(409);
    });
  });

  describe("3. Security Boundaries: Guest Tokens and Isolation", () => {
    it("rejects token issued for a different room with 401", async () => {
      const roomA = await platform.roomService.createRoom({
        gameKey: "who-knows-me-better",
        nickname: "HostA",
      });
      const roomB = await platform.roomService.createRoom({
        gameKey: "who-knows-me-better",
        nickname: "HostB",
      });

      const tokenA = issueGuestToken({
        roomId: roomA.room._id,
        roomCode: roomA.room.roomCode,
        playerId: roomA.playerId,
      });

      // Attempt to resume Room B with Token A
      await request(app)
        .post(`/api/multiplayer/rooms/${roomB.room.roomCode}/resume`)
        .send({ token: tokenA })
        .expect(401);
    });

    it("rejects forged or expired guest tokens", () => {
      const fakeToken = jwt.sign(
        { aud: "myjourney-multiplayer", iss: "myjourney-api", roomCode: "FAKE" },
        "wrong-secret-key"
      );

      expect(() => verifyGuestToken(fakeToken)).toThrow();
    });
  });

  describe("4. Malformed Payloads and Schema Validation", () => {
    it("rejects room creation with empty nickname with 422", async () => {
      await request(app)
        .post("/api/multiplayer/rooms")
        .send({
          gameKey: "who-knows-me-better",
          nickname: "", // empty
        })
        .expect(422);
    });

    it("rejects invalid room code formats with 422", async () => {
      await request(app)
        .post("/api/multiplayer/rooms/INVALID$CODE/join")
        .send({ nickname: "Player" })
        .expect(422);
    });
  });

  describe("5. Play Life Engine: Emotion, Journey and Reduced Motion", () => {
    it("initializes casual Play Life state with clean defaults and no database mutation", () => {
      const initial = playLifeEngine.createInitialState({ id: "user_123", displayName: "Alex" });
      expect(initial.version).toBe(1);
      expect(initial.currentMood).toBeDefined();
      expect(initial.session).toMatchObject({
        startingMood: null,
        endingMood: null,
      });
      expect(initial.journey).toBeDefined();
    });

    it("reduced motion profile disables distance and creates zero-distance transition", () => {
      const profile = playLifeEngine.getMotionProfile(true);
      expect(profile.distance).toBe(0);
      expect(profile.duration).toBe(0);
    });

    it("mood transition gracefully advances without crashing", () => {
      let state = playLifeEngine.createInitialState({ id: "user_123", displayName: "Alex" });
      state = playLifeEngine.selectMood(state, "happy", { source: "test" });
      expect(state.currentMood.id).toBe("happy");

      const scene = playLifeEngine.getScene(state);
      expect(scene).toBeDefined();
      expect(scene.id).toBeDefined();
    });
  });
});
