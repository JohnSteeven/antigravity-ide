/** PasswordRule.js — +30 pts if password is configured */
const { SECURITY_SCORE } = require("../../config/security");

module.exports = {
  id: "hasPassword",
  label: "Password Protected",
  points: SECURITY_SCORE.PASSWORD_CONFIGURED,
  evaluate(user) {
    const pass = Boolean(user.passwordHash);
    return {
      pass,
      points: pass ? this.points : 0,
      message: pass ? null : "Set a strong password to protect your account.",
    };
  },
};
