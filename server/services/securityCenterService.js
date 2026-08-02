/**
 * securityCenterService.js
 * Thin orchestrator — delegates to focused services.
 * Do NOT add business logic here. Add it to the appropriate focused service.
 */

const securityScoreService = require("./securityScoreService");
const sessionService = require("./sessionService");
const loginHistoryService = require("./loginHistoryService");
const trustedDeviceService = require("./trustedDeviceService");
const ActivityLog = require("../models/ActivityLog");

const securityCenterService = {
  // ── Security Overview ──────────────────────────────────────────────────────
  async getSecurityOverview(user) {
    const scoreData = securityScoreService.calculate(user);

    const lastActivity = await ActivityLog.findOne({
      $or: [{ userId: user._id }, { user: user._id }],
    })
      .sort({ createdAt: -1 })
      .select("action label severity createdAt browser os ipAddress country city")
      .lean()
      .catch(() => null);

    return {
      ...scoreData,
      lastPasswordChange: user.lastPasswordChange || null,
      lastActivity: lastActivity || null,
    };
  },

  // ── Sessions ───────────────────────────────────────────────────────────────
  getActiveSessions: (user, req) => sessionService.getActiveSessions(user, req),
  revokeSession: (userId, sessionId, req) => sessionService.revokeSession(userId, sessionId, req),
  revokeAllOtherSessions: (userId, req) => sessionService.revokeAllOtherSessions(userId, req),

  // ── Login History ──────────────────────────────────────────────────────────
  getLoginHistory: (userId, params) => loginHistoryService.getLoginHistory(userId, params),

  // ── Trusted Devices ────────────────────────────────────────────────────────
  getTrustedDevices: (userId, req) => trustedDeviceService.getTrustedDevices(userId, req),
  renameDevice: (userId, deviceId, name) => trustedDeviceService.renameDevice(userId, deviceId, name),
  removeDevice: (userId, deviceId) => trustedDeviceService.removeDevice(userId, deviceId),
};

module.exports = securityCenterService;
