const Setting = require("../models/Setting");

class SettingRepository {
  async findByKey(key) {
    return Setting.findOne({ key, isDeleted: { $ne: true } });
  }

  async create(data) {
    return Setting.create(data);
  }

  async updateByKey(key, value, userId) {
    const setting = await Setting.findOne({ key, isDeleted: { $ne: true } });
    if (!setting) {
      return Setting.create({
        key,
        value,
        createdBy: userId,
        updatedBy: userId,
        version: 1
      });
    }

    setting.value = value;
    setting.updatedBy = userId;
    setting.version += 1;
    return setting.save();
  }

  async softDeleteByKey(key, userId) {
    return Setting.findOneAndUpdate(
      { key, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restoreByKey(key, userId) {
    return Setting.findOneAndUpdate(
      { key, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new SettingRepository();
