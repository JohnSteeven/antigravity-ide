const express = require("express");
const securityController = require("../controllers/securityController");

const router = express.Router();

router.get("/overview", (req, res, next) => securityController.getOverview(req, res, next));
router.get("/sessions", (req, res, next) => securityController.getSessions(req, res, next));
router.delete("/sessions/:id", (req, res, next) => securityController.revokeSession(req, res, next));
router.delete("/sessions", (req, res, next) => securityController.revokeAllOtherSessions(req, res, next));
router.get("/login-history", (req, res, next) => securityController.getLoginHistory(req, res, next));
router.get("/devices", (req, res, next) => securityController.getDevices(req, res, next));
router.patch("/devices/:id", (req, res, next) => securityController.renameDevice(req, res, next));
router.delete("/devices/:id", (req, res, next) => securityController.removeDevice(req, res, next));

module.exports = router;
