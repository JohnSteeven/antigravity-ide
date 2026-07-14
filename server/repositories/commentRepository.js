const Comment = require("../models/Comment");

class CommentRepository {
  async find(filter = {}, sort = { isPinned: -1, createdAt: -1 }, includeDeleted = false) {
    const query = { ...filter };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return Comment.find(query)
      .sort(sort)
      .populate("authorId", "firstName lastName username email")
      .populate("articleId", "title slug")
      .lean();
  }

  async findById(id) {
    return Comment.findOne({ _id: id })
      .populate("authorId", "firstName lastName username email")
      .populate("articleId", "title slug");
  }

  async create(data) {
    return Comment.create(data);
  }

  async update(id, updateData) {
    return Comment.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Comment.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Comment.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new CommentRepository();
