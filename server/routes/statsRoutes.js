const express = require("express");
const statsController = require("../controllers/statsController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.get("/", authenticate, requireAdmin, statsController.getDashboardStats);

module.exports = router;
