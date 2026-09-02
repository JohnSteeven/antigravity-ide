/** RiskRule.js — +10 pts if no suspicious activity (failed logins, lockouts) */
const { SECURITY_SCORE } = require("../../config/security");

module.exports = {
  id: "noSuspiciousActivity",
  label: "No Suspicious Activity",
  points: SECURITY_SCORE.NO_SUSPICIOUS_ACTIVITY,
  evaluate(user) {
    const isLocked = user.lockUntil && user.lockUntil.getTime() > Date.now();
    const hasFailedAttempts = Number(user.failedLoginAttempts || 0) > 0;
    const pass = !isLocked && !hasFailedAttempts;
    return {
      pass,
      points: pass ? this.points : 0,
      message: pass ? null : "Failed sign-in attempts were recorded recently. Review your active sessions.",
    };
  },
};
