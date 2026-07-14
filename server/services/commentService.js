const commentRepository = require("../repositories/commentRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

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
