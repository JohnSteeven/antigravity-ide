const commentService = require("../services/commentService");

class CommentController {
  async getComments(req, res, next) {
    try {
      const filter = {};
      if (req.query.status && req.query.status !== "all") {
        filter.status = req.query.status;
      }
      if (req.query.articleId) {
        filter.articleId = req.query.articleId;
      }
      const includeDeleted = req.query.includeDeleted === "true";
      const comments = await commentService.getComments(filter, includeDeleted);
      res.json({ success: true, comments });
    } catch (err) {
      next(err);
    }
  }

  async updateComment(req, res, next) {
    try {
      const { id } = req.params;
      const { status, body, isPinned } = req.body;
      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (body !== undefined) updateData.body = body;
      if (isPinned !== undefined) updateData.isPinned = isPinned;

      const comment = await commentService.updateComment(id, updateData, req.user?._id);
      res.json({ success: true, comment, message: "Comment updated successfully." });
    } catch (err) {
      next(err);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const { id } = req.params;
      await commentService.softDeleteComment(id, req.user?._id);
      res.json({ success: true, message: "Comment soft-deleted successfully." });
    } catch (err) {
      next(err);
    }
  }

  async restoreComment(req, res, next) {
    try {
      const { id } = req.params;
      const comment = await commentService.restoreComment(id, req.user?._id);
      res.json({ success: true, comment, message: "Comment restored successfully." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommentController();
