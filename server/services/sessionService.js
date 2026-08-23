/**
 * sessionService.js
 * Manages active sessions: list, revoke, revoke-all, risk detection.
 */

const Session = require("../models/Session");
const RefreshToken = require("../models/RefreshToken");
const ActivityLog = require("../models/ActivityLog");
const { SESSION_RISK, ACTIONS } = require("../config/security");
const { hashToken } = require("./tokenService");

/** Extract useful metadata from an express request */
const extractMeta = (req) => ({
  ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "127.0.0.1",
  userAgent: req?.headers?.["user-agent"] || "Unknown",
  browser: req?.headers?.["user-agent"]?.includes("Firefox") ? "Firefox" : "Chrome",
  os: "Windows",
});

/** Determine session risk level */
const getRiskLevel = (sess, currentRefreshRecordId) => {
  if (
    currentRefreshRecordId &&
    String(sess.refreshToken) === String(currentRefreshRecordId)
  ) return SESSION_RISK.CURRENT;

  const ageMs = Date.now() - new Date(sess.createdAt).getTime();
  const isNew = ageMs < 24 * 60 * 60 * 1000; // less than 24h old

  return isNew ? SESSION_RISK.NEW_DEVICE : SESSION_RISK.TRUSTED;
};

const getCurrentRefreshRecordId = async (req) => {
  const token = req?.cookies?.refreshToken;
  if (!token) return null;
  const record = await RefreshToken.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("_id").lean();
  return record?._id || null;
};

const sessionService = {
  async getActiveSessions(user, req) {
    const rawSessions = await Session.find({
      user: user._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    const currentRefreshRecordId = await getCurrentRefreshRecordId(req);

    return rawSessions.map((sess) => {
      const riskLevel = getRiskLevel(sess, currentRefreshRecordId);
      return {
        id: sess._id.toString(),
        browser: sess.browser || "Unknown browser",
        os: sess.os || "Unknown OS",
        device: sess.device || "Unknown device",
        ipAddress: sess.ipAddress || "unknown",
        country: sess.country || "Unknown",
        city: sess.city || "Unknown",
        isCurrent: riskLevel === SESSION_RISK.CURRENT,
        riskLevel,
        lastActiveAt: sess.lastActiveAt || sess.createdAt,
        loginAt: sess.createdAt,
      };
    });
  },

  async revokeSession(userId, sessionId, req) {
    const session = await Session.findOneAndUpdate(
      { _id: sessionId, user: userId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!session) {
      const err = new Error("Session not found or already revoked.");
      err.status = 404;
      throw err;
    }

    const meta = extractMeta(req);
    await RefreshToken.findOneAndUpdate(
      { _id: session.refreshToken, user: userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

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
    const currentRefreshRecordId = await getCurrentRefreshRecordId(req);
    const meta = extractMeta(req);

    const filter = { user: userId, isActive: true };
    if (currentRefreshRecordId) {
      filter.refreshToken = { $ne: String(currentRefreshRecordId) };
    }

    const sessions = await Session.find(filter).select("refreshToken").lean();
    const result = await Session.updateMany(filter, { $set: { isActive: false } });
    const refreshTokenIds = sessions.map((session) => session.refreshToken).filter(Boolean);
    if (refreshTokenIds.length) {
      await RefreshToken.updateMany(
        { _id: { $in: refreshTokenIds }, user: userId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

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
