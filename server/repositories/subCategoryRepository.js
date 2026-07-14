const SubCategory = require("../models/SubCategory");

class SubCategoryRepository {
  async find(filter = {}, includeDeleted = false) {
    const query = { ...filter };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return SubCategory.find(query)
      .populate("category", "name slug")
      .lean();
  }

  async findById(id) {
    return SubCategory.findOne({ _id: id, isDeleted: false })
      .populate("category", "name slug");
  }

  async create(data) {
    return SubCategory.create(data);
  }

  async update(id, updateData) {
    return SubCategory.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return SubCategory.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return SubCategory.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new SubCategoryRepository();
