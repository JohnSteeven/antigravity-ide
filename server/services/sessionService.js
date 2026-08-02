/**
 * sessionService.js
 * Manages active sessions: list, revoke, revoke-all, risk detection.
 */

const Session = require("../models/Session");
const ActivityLog = require("../models/ActivityLog");
const { SESSION_RISK, ACTIONS } = require("../config/security");

/** Extract useful metadata from an express request */
const extractMeta = (req) => ({
  ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "127.0.0.1",
  userAgent: req?.headers?.["user-agent"] || "Unknown",
  browser: req?.headers?.["user-agent"]?.includes("Firefox") ? "Firefox" : "Chrome",
  os: "Windows",
});

/** Determine session risk level */
const getRiskLevel = (sess, currentToken, knownIPs) => {
  if (currentToken && sess.refreshToken === currentToken) return SESSION_RISK.CURRENT;

  const ipKnown = knownIPs.includes(sess.ipAddress);
  const ageMs = Date.now() - new Date(sess.createdAt).getTime();
  const isNew = ageMs < 24 * 60 * 60 * 1000; // less than 24h old

  if (!ipKnown && isNew) return SESSION_RISK.NEW_DEVICE;
  if (ipKnown) return SESSION_RISK.TRUSTED;
  return SESSION_RISK.NEW_DEVICE;
};

const sessionService = {
  async getActiveSessions(user, req) {
    const rawSessions = await Session.find({ user: user._id, isActive: true })
      .sort({ lastActiveAt: -1 })
      .lean();

    const currentRefreshToken = req?.cookies?.refreshToken || "";

    if (rawSessions.length === 0) {
      return [
        {
          id: "current-session-stub",
          browser: "Chrome",
          os: "Windows",
          device: "Desktop",
          ipAddress: req?.ip || "127.0.0.1",
          country: "Localhost",
          city: "Development",
          isCurrent: true,
          riskLevel: SESSION_RISK.CURRENT,
          lastActiveAt: new Date(),
          createdAt: new Date(),
        },
      ];
    }

    // Collect all known IPs for this user across sessions (trusted detection)
    const knownIPs = rawSessions.map((s) => s.ipAddress).filter(Boolean);

    return rawSessions.map((sess) => {
      const riskLevel = getRiskLevel(sess, currentRefreshToken, knownIPs);
      return {
        id: sess._id.toString(),
        browser: sess.browser || "Browser",
        os: sess.os || "OS",
        device: sess.device || "Desktop",
        ipAddress: sess.ipAddress || "127.0.0.1",
        country: sess.country || "Localhost",
        city: sess.city || "Development",
        isCurrent: riskLevel === SESSION_RISK.CURRENT,
        riskLevel,
        lastActiveAt: sess.lastActiveAt || sess.createdAt,
        loginAt: sess.createdAt,
      };
    });
  },

  async revokeSession(userId, sessionId, req) {
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      const err = new Error("Session not found or already revoked.");
      err.status = 404;
      throw err;
    }

    const meta = extractMeta(req);
    session.isActive = false;
    await session.save();

    await ActivityLog.create({
      userId,
      user: userId,
      action: ACTIONS.SESSION_REVOKED,
      description: `Session revoked for ${session.browser} on ${session.os}`,
      status: "SUCCESS",
      module: "security",
      ...meta,
    }).catch(() => {});

    return { success: true, message: "Session revoked successfully." };
  },

  async revokeAllOtherSessions(userId, req) {
    const currentRefreshToken = req?.cookies?.refreshToken || "";
    const meta = extractMeta(req);

    const filter = { user: userId, isActive: true };
    if (currentRefreshToken) {
      filter.refreshToken = { $ne: currentRefreshToken };
    }

    const result = await Session.updateMany(filter, { $set: { isActive: false } });

    await ActivityLog.create({
      userId,
      user: userId,
      action: ACTIONS.ALL_SESSIONS_REVOKED,
      description: `All other sessions revoked (${result.modifiedCount} sessions)`,
      status: "SUCCESS",
      module: "security",
      ...meta,
    }).catch(() => {});

    return { success: true, message: "All other sessions signed out.", count: result.modifiedCount };
  },
};

module.exports = sessionService;
