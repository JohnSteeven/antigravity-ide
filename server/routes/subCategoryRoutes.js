const express = require("express");
const subCategoryController = require("../controllers/subCategoryController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.get("/", subCategoryController.getSubCategories);
router.get("/:id", subCategoryController.getSubCategoryById);
router.post("/", authenticate, requireAdmin, subCategoryController.createSubCategory);
router.put("/:id", authenticate, requireAdmin, subCategoryController.updateSubCategory);
router.post("/:id/restore", authenticate, requireAdmin, subCategoryController.restoreSubCategory);
router.delete("/:id", authenticate, requireAdmin, subCategoryController.softDeleteSubCategory);

module.exports = router;
