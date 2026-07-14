const activityLogService = require("../services/activityLogService");

class ActivityLogController {
  async getLogs(req, res, next) {
    try {
      const logs = await activityLogService.getLogs(req.query);
      res.json({ success: true, ...logs });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ActivityLogController();
