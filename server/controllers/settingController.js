const settingService = require("../services/settingService");

class SettingController {
  async getSetting(req, res, next) {
    try {
      const { key } = req.params;
      const value = await settingService.getSettingByKey(key);
      res.json({ success: true, key, value });
    } catch (err) {
      next(err);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await settingService.updateSetting(key, value, req.user?._id);
      res.json({ success: true, setting });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingController();
