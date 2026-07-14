const express = require("express");
const { validationResult } = require("express-validator");
const { testimonialValidator } = require("../validators/testimonialValidator");
const testimonialController = require("../controllers/testimonialController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

// Public route to get testimonials
router.get("/", testimonialController.getTestimonials);

// Admin routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  testimonialValidator,
  validate,
  testimonialController.createTestimonial
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  testimonialValidator,
  validate,
  testimonialController.updateTestimonial
);
router.delete("/:id", authenticate, requireAdmin, testimonialController.deleteTestimonial);
router.post("/:id/restore", authenticate, requireAdmin, testimonialController.restoreTestimonial);

module.exports = router;
