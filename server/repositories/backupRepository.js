const Backup = require("../models/Backup");

class BackupRepository {
  async find(filter = {}) {
    return Backup.find({ ...filter, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    return Backup.findOne({ _id: id, isDeleted: false });
  }

  async create(data) {
    return Backup.create(data);
  }

  async softDelete(id, userId) {
    return Backup.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
  }
}

module.exports = new BackupRepository();
