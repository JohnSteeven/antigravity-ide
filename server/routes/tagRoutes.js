const express = require("express");
const { body, validationResult } = require("express-validator");
const tagController = require("../controllers/tagController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

router.get("/", tagController.getTags);
router.get("/:id", tagController.getTagById);

router.post(
  "/",
  authenticate,
  requireAdmin,
  [body("name").trim().notEmpty().withMessage("Name is required.")],
  validate,
  tagController.createTag
);

router.put("/:id", authenticate, requireAdmin, tagController.updateTag);
router.post("/:id/restore", authenticate, requireAdmin, tagController.restoreTag);
router.delete("/:id", authenticate, requireAdmin, tagController.deleteTag);

module.exports = router;
