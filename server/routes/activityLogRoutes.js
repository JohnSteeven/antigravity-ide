const express = require("express");
const activityLogController = require("../controllers/activityLogController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.get("/", authenticate, requireAdmin, activityLogController.getLogs);

module.exports = router;
