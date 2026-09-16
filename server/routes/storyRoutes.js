const express = require("express");
const { validationResult } = require("express-validator");
const storyController = require("../controllers/storyController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");
const { storyWriteValidator } = require("../validators/storyValidator");

const router = express.Router();
const validate = handleValidation(validationResult);

// Story-specific authoring endpoints. Article endpoints remain unchanged.
router.get("/admin/all", authenticate, requireAdmin, storyController.getAdminStories);
router.post("/", authenticate, requireAdmin, storyWriteValidator, validate, storyController.createStory);
router.put("/:id", authenticate, requireAdmin, storyWriteValidator, validate, storyController.updateStory);
router.put("/:id/status", authenticate, requireAdmin, storyController.updateStoryStatus);
router.put("/:id/save", authenticate, storyController.setSaved);

// Public Story routes.
router.get("/", optionalAuthenticate, storyController.getStories);
router.get("/:slug", optionalAuthenticate, storyController.getStoryBySlug);

module.exports = router;
