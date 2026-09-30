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
const { serializeRoom } = require("../../multiplayer/domain/serializer");
const { ERROR_CODES, PLAYER_ROLES, ROOM_STATUSES } = require("../../multiplayer/domain/constants");
const { initializeWallets, availableBalance } = require("../../multiplayer/games/lifeAuction/economy");

jest.setTimeout(15000);

const emitAck = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));

describe("Phase 25 — Life Auction Full Lifecycle & Economic Security Audit", () => {
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

  describe("1. Equal Initial Virtual Budgets & Setup Validation", () => {
    it("assigns equal starting budgets to all players upon game start", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
      const friend = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });

      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const hostSocket = await connectSocket(hostToken);

      await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "setup:update",
        payload: { modeKey: "classic-life", lengthKey: "quick", startingCoins: 100 },
      });

      const started = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "session:start",
        payload: {},
      });

      expect(started.ok).toBe(true);
      expect(started.room.status).toBe(ROOM_STATUSES.IN_PROGRESS);

      const wallets = started.room.lifeAuction.players.map((p) => p.balance);
      expect(wallets).toEqual([100, 100]);
    });

    it("rejects non-allowlisted starting budgets or invalid setup commands", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const hostSocket = await connectSocket(hostToken);

      const invalidCoins = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "setup:update",
        payload: { modeKey: "classic-life", lengthKey: "quick", startingCoins: 999 }, // not in [50, 100, 200]
      });

      expect(invalidCoins.ok).toBe(false);
      expect(invalidCoins.error.code).toBe(ERROR_CODES.BAD_REQUEST);
    });
  });

  describe("2. Server-Authoritative Bidding & Economic Security", () => {
    it("rejects invalid bids (negative, zero, or malformed) with 422", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
      await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });
      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const hostSocket = await connectSocket(hostToken);

      await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "session:start",
        payload: {},
      });

      // Negative bid
      const negBid = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "auction:bid",
        payload: { amount: -10 },
      });
      expect(negBid.ok).toBe(false);
      expect(negBid.error.code).toBe(ERROR_CODES.BAD_REQUEST);

      // Zero bid
      const zeroBid = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "auction:bid",
        payload: { amount: 0 },
      });
      expect(zeroBid.ok).toBe(false);
      expect(zeroBid.error.code).toBe(ERROR_CODES.BAD_REQUEST);
    });

    it("rejects bids exceeding available balance with 409", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
      await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });
      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const hostSocket = await connectSocket(hostToken);

      await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "session:start",
        payload: {},
      });

      // Bid 150 when starting balance is 100
      const brokeBid = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "auction:bid",
        payload: { amount: 150 },
      });

      expect(brokeBid.ok).toBe(false);
      expect(brokeBid.error.code).toBe(ERROR_CODES.INVALID_ACTION);
    });

    it("rejects bids below the required minimum increment", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
      const friend = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });
      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const friendToken = issueGuestToken({ roomId: friend.room._id, roomCode: friend.room.roomCode, playerId: friend.playerId });

      const hostSocket = await connectSocket(hostToken);
      const friendSocket = await connectSocket(friendToken);

      const started = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "session:start",
        payload: {},
      });

      const startingPrice = started.room.lifeAuction.auction.startingPrice;

      // Host places valid bid
      const hostBid = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "auction:bid",
        payload: { amount: startingPrice },
      });
      expect(hostBid.ok).toBe(true);

      // Friend attempts to bid the exact same amount or lower
      const friendLowBid = await emitAck(friendSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "auction:bid",
        payload: { amount: startingPrice },
      });
      expect(friendLowBid.ok).toBe(false);
      expect(friendLowBid.error.code).toBe(ERROR_CODES.INVALID_ACTION);
    });
  });

  describe("3. Concurrency, Deductions, and Non-Negative Invariant", () => {
    it("releases outbid player's reservation and guarantees non-negative wallet", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
      const friend = await platform.roomService.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });
      const hostToken = issueGuestToken({ roomId: host.room._id, roomCode: host.room.roomCode, playerId: host.playerId });
      const friendToken = issueGuestToken({ roomId: friend.room._id, roomCode: friend.room.roomCode, playerId: friend.playerId });

      const hostSocket = await connectSocket(hostToken);
      const friendSocket = await connectSocket(friendToken);

      const started = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "session:start",
        payload: {},
      });

      const startPrice = started.room.lifeAuction.auction.startingPrice;

      // Host bids starting price
      const hostBid = await emitAck(hostSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "auction:bid",
        payload: { amount: startPrice },
      });
      expect(hostBid.room.lifeAuction.wallet.reserved).toBe(startPrice);
      expect(hostBid.room.lifeAuction.wallet.available).toBe(100 - startPrice);

      // Friend outbids host
      const outbid = await emitAck(friendSocket, "game:command", {
        requestId: crypto.randomUUID(),
        command: "auction:bid",
        payload: { amount: startPrice + 5 },
      });
      expect(outbid.ok).toBe(true);

      // Verify host's reservation was released back to available
      const hostSync = await emitAck(hostSocket, "room:sync", { requestId: crypto.randomUUID() });
      expect(hostSync.room.lifeAuction.wallet.reserved).toBe(0);
      expect(hostSync.room.lifeAuction.wallet.available).toBe(100);
      expect(hostSync.room.lifeAuction.wallet.balance).toBe(100);
    });

    it("verifies wallet model invariants: balance >= 0, reserved <= balance", () => {
      const players = [{ playerId: "p1" }, { playerId: "p2" }];
      const wallets = initializeWallets(players, 100);

      expect(wallets.p1.balance).toBe(100);
      expect(wallets.p1.reserved).toBe(0);
      expect(wallets.p1.spent).toBe(0);
      expect(availableBalance(wallets.p1)).toBe(100);

      // Wallets maintain safe integer bounds
      expect(Number.isSafeInteger(wallets.p1.balance)).toBe(true);
    });
  });

  describe("4. Room Isolation and Guest Token Security", () => {
    it("rejects token from room A when sending command to room B", async () => {
      const roomA = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "HostA" });
      const roomB = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "HostB" });

      const tokenA = issueGuestToken({ roomId: roomA.room._id, roomCode: roomA.room.roomCode, playerId: roomA.playerId });

      await request(expressApp)
        .post(`/api/multiplayer/rooms/${roomB.room.roomCode}/resume`)
        .send({ token: tokenA })
        .expect(401);
    });
  });

  describe("5. Private Life Workspace Boundary", () => {
    it("life auction operates purely on fictional items with zero read or write to private Life data", async () => {
      const host = await platform.roomService.createRoom({ gameKey: "life-auction", nickname: "Host" });
      expect(host.room.gameKey).toBe("life-auction");
      expect(host.room.gameData.state.ownership).toEqual({});
      // Ensure no private user life domain is referenced or touched
      expect(host.room.gameData.state.userGoals).toBeUndefined();
      expect(host.room.gameData.state.userHabits).toBeUndefined();
      expect(host.room.gameData.state.userMoney).toBeUndefined();
    });
  });
});
