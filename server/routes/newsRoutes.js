const express = require("express");
const newsController = require("../controllers/newsController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

// Public routes for news browsing and client-side click/impression tracking
router.get("/", newsController.getNews);
router.post("/analytics/click", newsController.trackClick);
router.post("/analytics/impression", newsController.trackImpression);

// Admin-only route for news traffic and analytics summaries
router.get("/analytics/stats", authenticate, requireAdmin, newsController.getStats);

module.exports = router;
