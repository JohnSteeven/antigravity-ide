const express = require("express");
const commentController = require("../controllers/commentController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validationResult } = require("express-validator");
const { handleValidation } = require("../middleware/errorHandler");
const { updateCommentValidator } = require("../validators/commentValidator");

const router = express.Router();
const validate = handleValidation(validationResult);

router.use(authenticate);
router.use(requireAdmin);

router.get("/", commentController.getComments);
router.put("/:id", updateCommentValidator, validate, commentController.updateComment);
router.post("/:id/restore", commentController.restoreComment);
router.delete("/:id", commentController.deleteComment);

module.exports = router;
