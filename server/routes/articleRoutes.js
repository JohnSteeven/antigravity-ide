const express = require("express");
const { validationResult } = require("express-validator");
const {
  createArticleValidator,
  addCommentValidator,
} = require("../validators/articleValidator");
const articleController = require("../controllers/articleController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

// Public Routes
router.get("/", optionalAuthenticate, articleController.getArticles);
router.get("/admin/all", authenticate, requireAdmin, articleController.getAdminArticles);
router.get("/:slug", optionalAuthenticate, articleController.getArticleBySlug);
router.post("/:id/views", articleController.incrementViews);
router.post("/:id/like", authenticate, articleController.likeArticle);
router.post("/:id/bookmark", authenticate, articleController.bookmarkArticle);
router.post("/:id/save", authenticate, articleController.saveArticle);
router.get("/:id/comments", articleController.getComments);
router.post(
  "/:id/comments",
  authenticate,
  addCommentValidator,
  validate,
  articleController.addComment
);

// Admin Routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  createArticleValidator,
  validate,
  articleController.createArticle
);
router.put("/:id", authenticate, requireAdmin, articleController.updateArticle);
router.post("/:id/restore", authenticate, requireAdmin, articleController.restoreArticle);
router.delete("/:id", authenticate, requireAdmin, articleController.deleteArticle);
router.put("/:id/status", authenticate, requireAdmin, articleController.updateStatus);



module.exports = router;
