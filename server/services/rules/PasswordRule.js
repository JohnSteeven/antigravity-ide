/** PasswordRule.js — +30 pts if password is configured */
const { SECURITY_SCORE } = require("../../config/security");

module.exports = {
  id: "hasPassword",
  label: "Password Protected",
  points: SECURITY_SCORE.PASSWORD_CONFIGURED,
  evaluate(user) {
    const pass = user.passwordHash !== undefined
      ? Boolean(user.passwordHash)
      : Boolean(!user.provider || user.provider === "password");
    return {
      pass,
      points: pass ? this.points : 0,
      message: pass ? null : "Set a strong password to protect your account.",
    };
  },
};
