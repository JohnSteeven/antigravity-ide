const express = require("express");
const { validationResult } = require("express-validator");
const { createCategoryValidator } = require("../validators/categoryValidator");
const categoryController = require("../controllers/categoryController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

router.post(
  "/",
  authenticate,
  requireAdmin,
  createCategoryValidator,
  validate,
  categoryController.createCategory
);

router.put("/:id", authenticate, requireAdmin, categoryController.updateCategory);
router.patch("/:id", authenticate, requireAdmin, categoryController.updateCategory);
router.post("/:id/restore", authenticate, requireAdmin, categoryController.restoreCategory);
router.delete("/:id", authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;
