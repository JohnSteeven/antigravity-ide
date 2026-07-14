const settingRepository = require("../repositories/settingRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class SettingService {
  async getSettingByKey(key) {
    const setting = await settingRepository.findByKey(key);
    return setting ? setting.value : null;
  }

  async updateSetting(key, value, userId) {
    const setting = await settingRepository.updateByKey(key, value, userId);
    
    await activityLogRepository.create({
      action: "setting_update",
      description: `Updated system setting key "${key}" to version ${setting.version}`,
      userId,
    });
    return setting;
  }
}

module.exports = new SettingService();
