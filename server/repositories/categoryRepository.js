const Category = require("../models/Category");

class CategoryRepository {
  async find(filter = {}, sort = { sortOrder: 1, name: 1 }, includeDeleted = false) {
    const query = { ...filter };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return Category.find(query)
      .sort(sort)
      .lean();
  }

  async findById(id) {
    return Category.findOne({ _id: id, isDeleted: false });
  }

  async findBySlug(slug) {
    return Category.findOne({ slug, isDeleted: false });
  }

  async create(data) {
    return Category.create(data);
  }

  async update(id, updateData) {
    return Category.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Category.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Category.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new CategoryRepository();
