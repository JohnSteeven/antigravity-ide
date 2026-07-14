const express = require("express");
const commentController = require("../controllers/commentController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/", commentController.getComments);
router.put("/:id", commentController.updateComment);
router.post("/:id/restore", commentController.restoreComment);
router.delete("/:id", commentController.deleteComment);

module.exports = router;
