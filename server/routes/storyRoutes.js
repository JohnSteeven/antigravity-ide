const express = require("express");
const storyController = require("../controllers/storyController");

const router = express.Router();

// Public Story Routes
router.get("/", storyController.getStories);
router.get("/:slug", storyController.getStoryBySlug);

module.exports = router;
