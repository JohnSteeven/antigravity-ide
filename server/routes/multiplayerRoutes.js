const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const createRoomController = require("../multiplayer/controllers/roomController");
const { multiplayerPlatform } = require("../multiplayer/platform");
const { createRoomLimiter, joinRoomLimiter, resumeRoomLimiter } = require("../multiplayer/security/rateLimits");

const createMultiplayerRouter = (platform) => {
  const router = express.Router();
  const controller = createRoomController(platform);
  router.get("/games", controller.listGames);
  router.get("/health", controller.health);
  router.get("/metrics", authenticate, requireAdmin, controller.metrics);
  router.post("/rooms", createRoomLimiter, controller.create);
  router.post("/rooms/:code/join", joinRoomLimiter, controller.join);
  router.post("/rooms/:code/resume", resumeRoomLimiter, controller.resume);
  router.get("/rooms/:code/invite-qr", joinRoomLimiter, controller.inviteQr);
  return router;
};

module.exports = createMultiplayerRouter(multiplayerPlatform);
module.exports.createMultiplayerRouter = createMultiplayerRouter;
