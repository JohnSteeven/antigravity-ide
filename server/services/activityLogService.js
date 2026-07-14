const activityLogRepository = require("../repositories/activityLogRepository");

class ActivityLogService {
  async getLogs(query = {}) {
    const filter = {};

    if (query.action && query.action !== "all") {
      filter.action = query.action;
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.module && query.module !== "all") {
      filter.module = query.module;
    }
    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }
    if (query.ipAddress) {
      filter.ipAddress = query.ipAddress;
    }

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [
        { description: regex },
        { userEmail: regex },
        { action: regex },
      ];
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 50);
    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 };
    if (query.sortBy) {
      const direction = query.sortDir === "asc" ? 1 : -1;
      sort = { [query.sortBy]: direction };
    }

    const [logs, total] = await Promise.all([
      activityLogRepository.find(filter, sort, limit, skip),
      activityLogRepository.count(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createLog(data) {
    return activityLogRepository.create({
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      description: data.description,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      module: data.module,
      status: data.status || "success",
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      oldValue: data.oldValue,
      newValue: data.newValue,
      timestamp: data.timestamp || new Date(),
    });
  }
}

module.exports = new ActivityLogService();
