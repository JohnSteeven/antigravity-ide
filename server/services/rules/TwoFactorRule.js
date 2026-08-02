/** TwoFactorRule.js — +20 pts if 2FA is enabled (Phase 2B) */
const { SECURITY_SCORE } = require("../../config/security");

module.exports = {
  id: "twoFactorEnabled",
  label: "Two-Factor Authentication",
  points: SECURITY_SCORE.TWO_FACTOR_ENABLED,
  evaluate(user) {
    const pass = Boolean(user.twoFactor?.enabled);
    return {
      pass,
      points: pass ? this.points : 0,
      message: pass ? null : "Enable Two-Factor Authentication for a major security boost.",
    };
  },
};
