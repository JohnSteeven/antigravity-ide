const Session = require("../models/Session");
const TrustedDevice = require("../models/TrustedDevice");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

const formatRelativeDays = (date) => {
  if (!date) return null;
  const diffMs = Date.now() - new Date(date).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const securityCenterService = {
  async getSecurityOverview(user) {
    let score = 0;
    const checks = {
      hasPassword: Boolean(user.passwordHash),
      emailVerified: Boolean(user.verified?.email),
      mobileVerified: Boolean(user.verified?.mobile),
      recentPasswordUpdate: false,
      strongSecurityPosture: true,
      noSuspiciousActivity: true,
    };

    if (checks.hasPassword) score += 30;
    if (checks.emailVerified) score += 20;
    if (checks.mobileVerified) score += 15;

    const daysSincePasswordChange = formatRelativeDays(user.lastPasswordChange);
    if (daysSincePasswordChange !== null && daysSincePasswordChange < 90) {
      checks.recentPasswordUpdate = true;
      score += 15;
    } else if (daysSincePasswordChange === null) {
      checks.recentPasswordUpdate = true;
      score += 10;
    }

    if (!user.lockUntil) {
      score += 10;
    } else {
      checks.strongSecurityPosture = false;
    }

    if (Number(user.failedLoginAttempts || 0) === 0) {
      score += 10;
    } else {
      checks.noSuspiciousActivity = false;
    }

    let rating = "Needs Attention";
    if (score >= 85) rating = "Excellent";
    else if (score >= 65) rating = "Good";

    const recommendations = [];
    if (!checks.emailVerified) {
      recommendations.push("Verify your email address to secure account recovery.");
    }
    if (!checks.mobileVerified) {
      recommendations.push("Add a verified mobile number for multi-channel security alerts.");
    }
    if (daysSincePasswordChange !== null && daysSincePasswordChange > 90) {
      recommendations.push("Your password was updated over 90 days ago. Consider changing it.");
    }
    if (!checks.noSuspiciousActivity) {
      recommendations.push("Failed sign-in attempts were recorded recently. Review active sessions.");
    }

    const lastActivity = await ActivityLog.findOne({
      $or: [{ userId: user._id }, { user: user._id }],
    })
      .sort({ createdAt: -1 })
      .select("action createdAt browser os ipAddress country city")
      .lean()
      .catch(() => null);

    return {
      score,
      rating,
      checks,
      recommendations,
      lastPasswordChange: user.lastPasswordChange || null,
      lastActivity: lastActivity || null,
    };
  },

  async getActiveSessions(user, req) {
    const rawSessions = await Session.find({ user: user._id, isActive: true })
      .sort({ lastActiveAt: -1 })
      .lean();

    if (rawSessions.length === 0) {
      const fallbackSession = {
        _id: "current-session-stub",
        id: "current-session-stub",
        browser: req?.headers?.["user-agent"]?.includes("Firefox") ? "Firefox" : "Chrome",
        os: "Windows",
        device: "Desktop",
        ipAddress: req?.ip || "127.0.0.1",
        country: "Localhost",
        city: "Development",
        isCurrent: true,
        lastActiveAt: new Date(),
        createdAt: new Date(),
      };
      return [fallbackSession];
    }

    const currentRefreshToken = req?.cookies?.refreshToken || "";

    return rawSessions.map((sess) => ({
      id: sess._id.toString(),
      _id: sess._id.toString(),
      browser: sess.browser || "Browser",
      os: sess.os || "OS",
      device: sess.device || "Desktop",
      ipAddress: sess.ipAddress || "127.0.0.1",
      country: sess.country || "Localhost",
      city: sess.city || "Development",
      isCurrent: Boolean(currentRefreshToken && sess.refreshToken === currentRefreshToken),
      lastActiveAt: sess.lastActiveAt || sess.createdAt,
      createdAt: sess.createdAt,
    }));
  },

  async revokeSession(userId, sessionId) {
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      const err = new Error("Session not found or already revoked.");
      err.status = 404;
      throw err;
    }
    session.isActive = false;
    await session.save();
    return { success: true, message: "Session revoked successfully." };
  },

  async revokeAllOtherSessions(userId, req) {
    const currentRefreshToken = req?.cookies?.refreshToken || "";
    const filter = { user: userId, isActive: true };
    if (currentRefreshToken) {
      filter.refreshToken = { $ne: currentRefreshToken };
    }
    await Session.updateMany(filter, { $set: { isActive: false } });
    return { success: true, message: "All other sessions signed out." };
  },

  async getLoginHistory(userId, { page = 1, limit = 10, range = "all", search = "" }) {
    const query = { $or: [{ userId: userId }, { user: userId }] };

    if (range === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfDay };
    } else if (range === "7days") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: sevenDaysAgo };
    } else if (range === "30days") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    if (search) {
      const reg = new RegExp(search, "i");
      query.$or = [
        { action: reg },
        { ipAddress: reg },
        { browser: reg },
        { os: reg },
        { city: reg },
        { country: reg },
      ];
    }

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (numericPage - 1) * numericLimit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log._id.toString(),
      action: log.action || "SECURITY_EVENT",
      browser: log.browser || "Unknown",
      os: log.os || "Unknown",
      ipAddress: log.ipAddress || "127.0.0.1",
      country: log.country || "Localhost",
      city: log.city || "Development",
      status: log.status || "SUCCESS",
      createdAt: log.createdAt,
    }));

    return {
      logs: formattedLogs,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.ceil(total / numericLimit) || 1,
      },
    };
  },

  async getTrustedDevices(userId, req) {
    let devices = await TrustedDevice.find({ user: userId }).sort({ lastSeenAt: -1 }).lean();

    if (devices.length === 0) {
      const defaultDevice = await TrustedDevice.create({
        user: userId,
        deviceName: "Primary Workstation",
        deviceType: "Desktop",
        browser: req?.headers?.["user-agent"]?.includes("Firefox") ? "Firefox" : "Chrome",
        os: "Windows",
        ipAddress: req?.ip || "127.0.0.1",
        country: "Localhost",
        city: "Development",
        isCurrentDevice: true,
        trustedSince: new Date(),
        lastSeenAt: new Date(),
      });
      devices = [defaultDevice.toObject()];
    }

    return devices.map((dev) => ({
      id: dev._id.toString(),
      _id: dev._id.toString(),
      deviceName: dev.deviceName,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      ipAddress: dev.ipAddress,
      country: dev.country,
      city: dev.city,
      isCurrentDevice: dev.isCurrentDevice,
      trustedSince: dev.trustedSince,
      lastSeenAt: dev.lastSeenAt,
    }));
  },

  async renameDevice(userId, deviceId, deviceName) {
    const dev = await TrustedDevice.findOne({ _id: deviceId, user: userId });
    if (!dev) {
      const err = new Error("Device not found.");
      err.status = 404;
      throw err;
    }
    dev.deviceName = deviceName.trim();
    await dev.save();
    return { success: true, device: dev };
  },

  async removeDevice(userId, deviceId) {
    const res = await TrustedDevice.deleteOne({ _id: deviceId, user: userId });
    if (res.deletedCount === 0) {
      const err = new Error("Device not found.");
      err.status = 404;
      throw err;
    }
    return { success: true, message: "Device removed from trusted list." };
  },
};

module.exports = securityCenterService;
