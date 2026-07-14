const ActivityLog = require("../models/ActivityLog");

class ActivityLogRepository {
  async find(filter = {}, sort = { createdAt: -1 }, limit = 100, skip = 0) {
    return ActivityLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName username email")
      .lean();
  }

  async count(filter = {}) {
    return ActivityLog.countDocuments(filter);
  }

  async create(data) {
    return ActivityLog.create(data);
  }
}

module.exports = new ActivityLogRepository();
