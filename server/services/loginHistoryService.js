/**
 * loginHistoryService.js
 * Server-side paginated login history with search, filters, and action badge metadata.
 */

const ActivityLog = require("../models/ActivityLog");

/** Map action strings to display severity for the frontend */
const ACTION_SEVERITY = {
  LOGIN_SUCCESS: { label: "Login Success", severity: "success" },
  login_success: { label: "Login Success", severity: "success" },
  LOGIN_FAILED: { label: "Login Failed", severity: "danger" },
  login_failed: { label: "Login Failed", severity: "danger" },
  LOGOUT: { label: "Logged Out", severity: "info" },
  PASSWORD_CHANGED: { label: "Password Changed", severity: "warning" },
  password_changed: { label: "Password Changed", severity: "warning" },
  PASSWORD_RESET: { label: "Password Reset", severity: "warning" },
  SESSION_REVOKED: { label: "Session Revoked", severity: "neutral" },
  ALL_SESSIONS_REVOKED: { label: "All Sessions Revoked", severity: "neutral" },
  EMAIL_VERIFIED: { label: "Email Verified", severity: "info" },
  email_verified: { label: "Email Verified", severity: "info" },
  TWO_FACTOR_ENABLED: { label: "2FA Enabled", severity: "purple" },
  TWO_FACTOR_DISABLED: { label: "2FA Disabled", severity: "warning" },
  PASSKEY_ADDED: { label: "Passkey Added", severity: "purple" },
  PASSKEY_REMOVED: { label: "Passkey Removed", severity: "neutral" },
  ACCOUNT_DELETE_REQUESTED: { label: "Delete Requested", severity: "danger" },
  ACCOUNT_DELETE_CANCELLED: { label: "Deletion Cancelled", severity: "success" },
  user_profile_update: { label: "Profile Updated", severity: "info" },
  media_delete: { label: "Media Deleted", severity: "neutral" },
};

const getActionMeta = (action) =>
  ACTION_SEVERITY[action] || { label: action, severity: "neutral" };

const loginHistoryService = {
  async getLoginHistory(userId, { page = 1, limit = 5, range = "all", search = "" }) {
    const userFilter = { $or: [{ userId }, { user: userId }] };

    // Date range filter
    if (range === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      userFilter.createdAt = { $gte: start };
    } else if (range === "7days") {
      userFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (range === "30days") {
      userFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    // Search filter — replaces $or if already set
    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), "i");
      userFilter.$or = [
        { action: reg },
        { ipAddress: reg },
        { browser: reg },
        { os: reg },
        { city: reg },
        { country: reg },
        { description: reg },
      ];
    }

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 5));
    const skip = (numericPage - 1) * numericLimit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(userFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      ActivityLog.countDocuments(userFilter),
    ]);

    const formattedLogs = logs.map((log) => {
      const meta = getActionMeta(log.action);
      return {
        id: log._id.toString(),
        action: log.action,
        label: meta.label,
        severity: meta.severity,
        browser: log.browser || log.userAgent?.split(" ")[0] || "Unknown",
        os: log.os || "Unknown",
        ipAddress: log.ipAddress || "127.0.0.1",
        country: log.country || "Localhost",
        city: log.city || "Development",
        status: log.status || "SUCCESS",
        description: log.description || "",
        createdAt: log.createdAt,
      };
    });

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
};

module.exports = loginHistoryService;
