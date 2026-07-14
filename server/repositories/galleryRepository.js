const Gallery = require("../models/Gallery");

class GalleryRepository {
  async find(filter = {}, sort = { sortOrder: 1, createdAt: -1 }, limit = 50, skip = 0) {
    return Gallery.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findWithDeleted(filter = {}, sort = { sortOrder: 1, createdAt: -1 }, limit = 50, skip = 0) {
    return Gallery.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filter = {}) {
    return Gallery.countDocuments({ ...filter, isDeleted: false });
  }

  async countWithDeleted(filter = {}) {
    return Gallery.countDocuments(filter);
  }

  async findById(id) {
    return Gallery.findOne({ _id: id, isDeleted: false });
  }

  async findByIdWithDeleted(id) {
    return Gallery.findOne({ _id: id });
  }

  async create(data) {
    return Gallery.create(data);
  }

  async update(id, updateData) {
    return Gallery.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Gallery.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Gallery.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }

  async getAlbums() {
    return Gallery.distinct("album", { isDeleted: false });
  }
}

module.exports = new GalleryRepository();
