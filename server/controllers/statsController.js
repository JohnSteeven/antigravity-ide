const statsService = require("../services/statsService");

class StatsController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await statsService.getDashboardStats();
      res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StatsController();
