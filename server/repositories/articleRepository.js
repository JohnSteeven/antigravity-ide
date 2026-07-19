const Article = require("../models/Article");

class ArticleRepository {
  async find(filter = {}, sort = { publishedAt: -1 }, limit = 50, skip = 0) {
    return Article.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("authorId", "firstName lastName username email")
      .lean();
  }

  async count(filter = {}) {
    return Article.countDocuments({ ...filter, isDeleted: false });
  }

  async findById(id) {
    return Article.findOne({ _id: id, isDeleted: false })
      .populate("authorId", "firstName lastName username email");
  }

  async findBySlug(slug) {
    return Article.findOne({ slug, isDeleted: false })
      .populate("authorId", "firstName lastName username email");
  }

  async findBySlugAny(slug) {
    return Article.findOne({ slug });
  }

  async create(data) {
    return Article.create(data);
  }

  async update(id, updateData) {
    const isOperator = Object.keys(updateData).some((key) => key.startsWith("$"));
    const updateObj = isOperator ? updateData : { $set: updateData };
    return Article.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateObj,
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Article.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Article.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new ArticleRepository();
