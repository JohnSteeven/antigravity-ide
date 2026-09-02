/** EmailRule.js — +20 pts if email is verified */
const { SECURITY_SCORE } = require("../../config/security");

module.exports = {
  id: "emailVerified",
  label: "Email Verified",
  points: SECURITY_SCORE.EMAIL_VERIFIED,
  evaluate(user) {
    const pass = Boolean(user.verified?.email);
    return {
      pass,
      points: pass ? this.points : 0,
      message: pass ? null : "Verify your email address to secure account recovery.",
    };
  },
};
