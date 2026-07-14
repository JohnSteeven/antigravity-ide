const express = require("express");
const { validationResult } = require("express-validator");
const { galleryValidator } = require("../validators/galleryValidator");
const galleryController = require("../controllers/galleryController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

// Public route to get gallery items
router.get("/", galleryController.getGalleryItems);
router.get("/albums", galleryController.getAlbums);

// Admin routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  galleryValidator,
  validate,
  galleryController.createGalleryItem
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  galleryValidator,
  validate,
  galleryController.updateGalleryItem
);
router.delete("/:id", authenticate, requireAdmin, galleryController.deleteGalleryItem);
router.post("/:id/restore", authenticate, requireAdmin, galleryController.restoreGalleryItem);

module.exports = router;
