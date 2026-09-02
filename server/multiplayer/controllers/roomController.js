const QRCode = require("qrcode");
const env = require("../../config/env");
const { parse, restSchemas, roomCode: roomCodeSchema } = require("../domain/protocol");
const { serializeRoom } = require("../domain/serializer");
const { issueGuestToken, verifyGuestToken } = require("../security/guestTokens");
const optionalUserId = require("../security/optionalUser");
const { getGame, listGames } = require("../games/registry");

const normalizeCode = (value) => String(value || "").trim().toUpperCase();
const parseCode = (value) => parse(roomCodeSchema, normalizeCode(value));

const createRoomController = (platform) => ({
  listGames(req, res) {
    res.json({ games: listGames().map((manifest) => ({
      ...manifest,
      categories: getGame(manifest.key).listCategories(),
    })) });
  },

  async create(req, res, next) {
    try {
      const input = parse(restSchemas.createRoom, req.body);
      const { room, playerId } = await platform.roomService.createRoom({
        ...input,
        userId: optionalUserId(req),
      });
      const token = issueGuestToken({ roomId: room._id, roomCode: room.roomCode, playerId });
      res.status(201).json({ token, room: serializeRoom(room, playerId) });
    } catch (error) {
      next(error);
    }
  },

  async join(req, res, next) {
    try {
      const input = parse(restSchemas.joinRoom, req.body);
      const roomCode = parseCode(req.params.code);
      const { room, playerId } = await platform.roomService.joinRoom({
        roomCode,
        nickname: input.nickname,
        userId: optionalUserId(req),
      });
      const token = issueGuestToken({ roomId: room._id, roomCode: room.roomCode, playerId });
      res.status(201).json({ token, room: serializeRoom(room, playerId) });
    } catch (error) {
      next(error);
    }
  },

  async resume(req, res, next) {
    try {
      const { token } = parse(restSchemas.resumeRoom, req.body);
      const identity = verifyGuestToken(token);
      const roomCode = parseCode(req.params.code);
      if (identity.roomCode !== roomCode) {
        const error = new Error("Session token does not match this room.");
        error.code = "MULTIPLAYER_INVALID_TOKEN";
        error.status = 401;
        throw error;
      }
      const room = await platform.repository.findById(identity.roomId);
      const state = room && serializeRoom(room, identity.playerId);
      if (!state) {
        const error = new Error("This player session is no longer active.");
        error.code = "MULTIPLAYER_INVALID_TOKEN";
        error.status = 401;
        throw error;
      }
      res.json({ token, room: state });
    } catch (error) {
      next(error);
    }
  },

  async inviteQr(req, res, next) {
    try {
      const roomCode = parseCode(req.params.code);
      const room = await platform.repository.findByCode(roomCode);
      if (!room) {
        const error = new Error("Room not found.");
        error.code = "MULTIPLAYER_ROOM_NOT_FOUND";
        error.status = 404;
        throw error;
      }
      const inviteUrl = `${env.clientUrl.replace(/\/$/, "")}/play-with-friends/join/${roomCode}`;
      const png = await QRCode.toBuffer(inviteUrl, { width: 280, margin: 2, errorCorrectionLevel: "M" });
      res.set("Cache-Control", "private, max-age=60");
      res.type("png").send(png);
    } catch (error) {
      next(error);
    }
  },

  health(req, res) {
    const ready = platform.readiness.enabled && platform.readiness.realtime && platform.readiness.storage &&
      (!env.multiplayer.requireRedis || platform.readiness.redis);
    res.status(ready ? 200 : 503).json({
      ok: ready,
      service: "myjourney-multiplayer",
      realtime: platform.readiness.realtime,
      storage: platform.readiness.storage,
      distributedFanout: platform.readiness.redis,
      mode: platform.readiness.mode,
    });
  },

  metrics(req, res) {
    res.json(platform.metrics.snapshot());
  },
});

module.exports = createRoomController;
