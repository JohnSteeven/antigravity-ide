const Media = require("../models/Media");

class MediaRepository {
  async find(filter = {}, sort = { createdAt: -1 }, limit = 50, skip = 0, includeDeleted = false) {
    const query = { ...filter };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return Media.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filter = {}, includeDeleted = false) {
    const query = { ...filter };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return Media.countDocuments(query);
  }

  async findById(id) {
    return Media.findOne({ _id: id, isDeleted: false });
  }

  async create(data) {
    return Media.create(data);
  }

  async update(id, updateData) {
    return Media.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Media.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Media.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }

  async distinctFolders() {
    return Media.distinct("folder", { isDeleted: false });
  }
}

module.exports = new MediaRepository();
