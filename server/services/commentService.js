const commentRepository = require("../repositories/commentRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

const STATUS_TRANSITIONS = Object.freeze({
  pending: new Set(["pending", "approved", "rejected", "spam", "hidden"]),
  approved: new Set(["approved", "rejected", "spam", "hidden"]),
  rejected: new Set(["rejected", "pending", "approved", "spam"]),
  spam: new Set(["spam", "pending", "rejected"]),
  hidden: new Set(["hidden", "pending", "approved", "rejected", "spam"]),
});

class CommentService {
  async getComments(filter = {}, includeDeleted = false) {
    return commentRepository.find(filter, { createdAt: -1 }, includeDeleted);
  }

  async getCommentById(id) {
    return commentRepository.findById(id);
  }

  async createComment(data, userId) {
    data.createdBy = userId;
    data.updatedBy = userId;
    const comment = await commentRepository.create(data);
    return comment;
  }

  async updateComment(id, data, userId) {
    const current = await commentRepository.findById(id);
    if (!current || current.isDeleted) {
      const error = new Error("Comment not found.");
      error.status = 404;
      throw error;
    }
    if (data.status !== undefined && !STATUS_TRANSITIONS[current.status]?.has(data.status)) {
      const error = new Error("Invalid comment status transition.");
      error.status = 422;
      throw error;
    }
    data.updatedBy = userId;
    const comment = await commentRepository.update(id, data);
    if (!comment) throw new Error("Comment not found.");

    await activityLogRepository.create({
      action: "comment_update",
      description: `Updated comment status/body for ID: ${comment._id}`,
      userId,
    });
    return comment;
  }

  async softDeleteComment(id, userId) {
    const comment = await commentRepository.softDelete(id, userId);
    if (!comment) throw new Error("Comment not found.");

    await activityLogRepository.create({
      action: "comment_delete",
      description: `Soft deleted comment ID: ${comment._id}`,
      userId,
    });
    return comment;
  }

  async restoreComment(id, userId) {
    const comment = await commentRepository.restore(id, userId);
    if (!comment) throw new Error("Comment not found.");

    await activityLogRepository.create({
      action: "comment_restore",
      description: `Restored comment ID: ${comment._id}`,
      userId,
    });
    return comment;
  }
}

module.exports = new CommentService();
module.exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
