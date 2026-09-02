const crypto = require("crypto");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const env = require("../../config/env");
const { parse, socketSchemas } = require("../domain/protocol");
const { serializeRoom } = require("../domain/serializer");
const { verifyGuestToken } = require("../security/guestTokens");
const logger = require("../observability/logger");
const PresenceRegistry = require("./PresenceRegistry");
const TimerCoordinator = require("./TimerCoordinator");

const errorPayload = (error) => ({
  code: error.code || "MULTIPLAYER_SERVER_UNAVAILABLE",
  message: error.status >= 500 ? "The game service hit a problem. Please retry." : error.message,
  retryable: Boolean(error.retryable || error.status >= 500),
  ...(error.details ? { details: error.details } : {}),
});

const attachMultiplayerSocketServer = async (httpServer, platform, options = {}) => {
  const nodeId = process.env.INSTANCE_ID || crypto.randomUUID();
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    maxHttpBufferSize: 16 * 1024,
    pingInterval: 15000,
    pingTimeout: 20000,
  });
  const namespace = io.of("/multiplayer");
  let pubClient = null;
  let subClient = null;

  if (env.multiplayer.redisUrl && options.redis !== false) {
    try {
      pubClient = createClient({ url: env.multiplayer.redisUrl });
      subClient = pubClient.duplicate();
      pubClient.on("error", (error) => logger.error("redis_publish_error", { message: error.message }));
      subClient.on("error", (error) => logger.error("redis_subscribe_error", { message: error.message }));
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      platform.readiness.redis = true;
      platform.readiness.mode = "distributed";
      pubClient.on("end", () => { platform.readiness.redis = false; });
      pubClient.on("ready", () => { platform.readiness.redis = true; });
    } catch (error) {
      await Promise.allSettled([pubClient?.quit(), subClient?.quit()]);
      pubClient = null;
      subClient = null;
      if (env.multiplayer.requireRedis) throw error;
      logger.warn("redis_unavailable_local_adapter", { message: error.message });
    }
  }

  if (!platform.readiness.redis) {
    if (env.multiplayer.requireRedis && options.redis !== false) {
      throw new Error("REDIS_URL is required for production multiplayer fanout.");
    }
    platform.readiness.mode = "single-instance";
  }

  const presence = new PresenceRegistry({
    redisClient: pubClient,
    ttlSeconds: env.multiplayer.roomTtlHours * 3600,
  });

  const broadcast = async (roomCode) => {
    const room = await platform.repository.findByCode(roomCode);
    if (!room) return;
    const sockets = await namespace.in(roomCode).fetchSockets();
    await Promise.all(sockets.map(async (socket) => {
      const state = serializeRoom(room, socket.data.playerId);
      if (state) socket.emit("room:update", state);
      else {
        socket.emit("session:removed", { message: "Your player was removed from this room." });
        socket.disconnect(true);
      }
    }));
  };

  namespace.use(async (socket, next) => {
    try {
      const identity = verifyGuestToken(socket.handshake.auth?.token);
      const room = await platform.repository.findById(identity.roomId);
      const player = room?.players.find((candidate) => candidate.playerId === identity.playerId);
      if (!room || !player || room.roomCode !== identity.roomCode) {
        const error = new Error("This player session is no longer active.");
        error.code = "MULTIPLAYER_INVALID_TOKEN";
        error.status = 401;
        throw error;
      }
      socket.data.roomId = String(room._id);
      socket.data.roomCode = room.roomCode;
      socket.data.playerId = identity.playerId;
      socket.data.rateWindow = { startedAt: Date.now(), count: 0 };
      next();
    } catch (error) {
      const authError = new Error(error.message);
      authError.data = errorPayload(error);
      next(authError);
    }
  });

  const disconnectSocket = (socketId) => {
    const socket = namespace.sockets.get(socketId);
    if (socket) {
      socket.emit("session:replaced", { message: "This player continued in another browser tab or device." });
      socket.disconnect(true);
    }
  };

  if (platform.readiness.redis) {
    namespace.on("multiplayer:replace", ({ socketId, targetNodeId }) => {
      if (targetNodeId === nodeId) disconnectSocket(socketId);
    });
  }

  let activeConnections = 0;

  namespace.on("connection", async (socket) => {
    activeConnections += 1;
    platform.metrics.gauge("active_connections", activeConnections);
    const session = {
      roomId: socket.data.roomId,
      roomCode: socket.data.roomCode,
      playerId: socket.data.playerId,
    };
    const initialization = (async () => {
      try {
        const previous = await presence.claim({ ...session, socketId: socket.id, nodeId });
        if (previous?.socketId && previous.socketId !== socket.id) {
          if (previous.nodeId === nodeId) disconnectSocket(previous.socketId);
          else if (platform.readiness.redis) {
            namespace.serverSideEmit("multiplayer:replace", {
              socketId: previous.socketId,
              targetNodeId: previous.nodeId,
            });
          }
        }
        socket.join(session.roomCode);
        await platform.roomService.setPresence({ ...session, connected: true });
        await broadcast(session.roomCode);
        return true;
      } catch (error) {
        socket.emit("game:error", errorPayload(error));
        socket.disconnect(true);
        return false;
      }
    })();

    const handle = (eventName, action) => {
      socket.on(eventName, async (rawPayload, acknowledgement = () => {}) => {
        const startedAt = Date.now();
        const metricEvent = eventName === "game:command" && /^[a-z][a-z0-9:_-]{1,60}$/.test(rawPayload?.command || "")
          ? `game:command:${rawPayload.command}`
          : eventName;
        try {
          if (!await initialization) {
            const error = new Error("The player session could not finish connecting.");
            error.code = "MULTIPLAYER_SERVER_UNAVAILABLE";
            error.status = 503;
            error.retryable = true;
            throw error;
          }
          const rate = socket.data.rateWindow;
          if (Date.now() - rate.startedAt > 10000) {
            rate.startedAt = Date.now();
            rate.count = 0;
          }
          rate.count += 1;
          if (rate.count > 35) {
            const error = new Error("Too many realtime actions. Slow down and retry.");
            error.code = "MULTIPLAYER_RATE_LIMITED";
            error.status = 429;
            error.retryable = true;
            throw error;
          }
          const payload = parse(socketSchemas[eventName], rawPayload);
          const result = await action(payload);
          await broadcast(session.roomCode);
          acknowledgement({
            ok: true,
            duplicate: Boolean(result?.duplicate),
            room: serializeRoom(result?.room || await platform.repository.findByCode(session.roomCode), session.playerId),
          });
          platform.metrics.increment("socket_event_success", { event: metricEvent });
        } catch (error) {
          const payload = errorPayload(error);
          acknowledgement({ ok: false, error: payload });
          socket.emit("game:error", payload);
          platform.metrics.increment("socket_event_error", { event: metricEvent, code: payload.code });
          if (metricEvent === "game:command:auction:bid") {
            try {
              const room = await platform.repository.findByCode(session.roomCode);
              platform.analytics?.track("bid_rejected", {
                room,
                playerId: session.playerId,
                metadata: { code: payload.code, auctionType: room?.gameData?.state?.currentAuction?.type || null },
              });
            } catch (analyticsError) {
              logger.warn("bid_rejection_analytics_failed", { roomCode: session.roomCode, message: analyticsError.message });
            }
          }
        } finally {
          platform.metrics.observeLatency(metricEvent, Date.now() - startedAt);
        }
      });
    };

    handle("room:sync", async () => ({ room: await platform.repository.findByCode(session.roomCode) }));
    handle("host:prepare", (payload) => platform.roomService.prepareHost({ ...session, ...payload }));
    handle("host:setup", (payload) => platform.roomService.saveHostAnswers({ ...session, ...payload }));
    handle("game:start", (payload) => platform.roomService.startGame({ ...session, ...payload }));
    handle("round:answer", (payload) => platform.roomService.answerRound({ ...session, ...payload }));
    handle("round:advance", (payload) => platform.roomService.advanceRound({ ...session, ...payload }));
    handle("game:rematch", (payload) => platform.roomService.rematch({ ...session, ...payload }));
    handle("party:switch-game", (payload) => platform.roomService.switchGame({ ...session, ...payload }));
    handle("host:transfer", (payload) => platform.roomService.transferHost({ ...session, ...payload }));
    handle("player:remove", (payload) => platform.roomService.removePlayer({ ...session, ...payload }));
    handle("game:command", (payload) => platform.roomService.executeGameCommand({ ...session, ...payload }));

    socket.on("disconnect", async () => {
      activeConnections = Math.max(0, activeConnections - 1);
      platform.metrics.gauge("active_connections", activeConnections);
      try {
        if (!await initialization) return;
        const released = await presence.release({ ...session, socketId: socket.id, nodeId });
        if (!released) return;
        await platform.roomService.setPresence({ ...session, connected: false });
        await broadcast(session.roomCode);
      } catch (error) {
        logger.warn("disconnect_presence_failed", { roomCode: session.roomCode, message: error.message });
      }
    });
  });

  const coordinator = new TimerCoordinator({ platform, broadcast });
  coordinator.start();
  platform.readiness.realtime = true;
  logger.info("realtime_started", { nodeId, mode: platform.readiness.mode });

  return {
    io,
    namespace,
    broadcast,
    async close() {
      coordinator.stop();
      platform.readiness.realtime = false;
      await new Promise((resolve) => io.close(resolve));
      await Promise.allSettled([pubClient?.quit(), subClient?.quit()]);
    },
  };
};

module.exports = { attachMultiplayerSocketServer, errorPayload };
