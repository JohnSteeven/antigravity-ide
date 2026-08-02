/**
 * securityScoreService.js
 * Rules-based security score calculator (max 100 points).
 * To add a new check: create a rule in ./rules/ and register it here.
 */

const PasswordRule = require("./rules/PasswordRule");
const EmailRule = require("./rules/EmailRule");
const RecentPasswordRule = require("./rules/RecentPasswordRule");
const TwoFactorRule = require("./rules/TwoFactorRule");
const RiskRule = require("./rules/RiskRule");

// Rules are evaluated in order. Easy to add / remove / reorder.
const RULES = [
  PasswordRule,
  EmailRule,
  RecentPasswordRule,
  TwoFactorRule,
  RiskRule,
];

const getRating = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
};

const securityScoreService = {
  /**
   * Calculate the security score for a user.
   * @param {Object} user - Mongoose user document or plain object
   * @returns {{ score, rating, checks, recommendations, breakdown }}
   */
  calculate(user) {
    let totalScore = 0;
    const checks = {};
    const recommendations = [];
    const breakdown = [];

    for (const rule of RULES) {
      const result = rule.evaluate(user);
      totalScore += result.points;
      checks[rule.id] = result.pass;

      breakdown.push({
        id: rule.id,
        label: rule.label,
        maxPoints: rule.points,
        earned: result.points,
        pass: result.pass,
      });

      if (!result.pass && result.message) {
        recommendations.push(result.message);
      }
    }

    // Clamp to 0–100
    const score = Math.min(100, Math.max(0, totalScore));

    return {
      score,
      rating: getRating(score),
      checks,
      recommendations,
      breakdown,
    };
  },
};

module.exports = securityScoreService;
