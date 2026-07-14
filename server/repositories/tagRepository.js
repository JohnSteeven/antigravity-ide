const Tag = require("../models/Tag");

class TagRepository {
  async find(filter = {}, includeDeleted = false) {
    const query = { ...filter };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return Tag.find(query)
      .sort({ name: 1 })
      .lean();
  }

  async findById(id) {
    return Tag.findOne({ _id: id, isDeleted: false });
  }

  async findBySlug(slug) {
    return Tag.findOne({ slug, isDeleted: false });
  }

  async create(data) {
    return Tag.create(data);
  }

  async update(id, updateData) {
    return Tag.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Tag.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Tag.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new TagRepository();
