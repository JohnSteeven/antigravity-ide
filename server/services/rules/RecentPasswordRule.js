/** RecentPasswordRule.js — +20 pts if password changed within 90 days */
const { SECURITY_SCORE } = require("../../config/security");

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

module.exports = {
  id: "recentPasswordUpdate",
  label: "Password Recently Updated",
  points: SECURITY_SCORE.RECENT_PASSWORD_CHANGE,
  evaluate(user) {
    const changed = user.lastPasswordChange;
    if (!changed) {
      // Never changed — give partial credit (password was set at registration)
      return { pass: true, points: Math.round(this.points * 0.5), message: null };
    }
    const isRecent = Date.now() - new Date(changed).getTime() < NINETY_DAYS_MS;
    return {
      pass: isRecent,
      points: isRecent ? this.points : 0,
      message: isRecent ? null : "Your password was last updated over 90 days ago. Consider changing it.",
    };
  },
};
