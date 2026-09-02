/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  reputationService.js  —  Community Reputation & Level Engine
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CommunityReputation = require('../models/CommunityReputation');

class ReputationService {
  /**
   * Award reputation points to a user.
   */
  static async awardPoints(userId, pointsAmount, reason = '') {
    let rep = await CommunityReputation.findOne({ userId });
    if (!rep) rep = new CommunityReputation({ userId });

    rep.points += pointsAmount;

    // Recalculate tier level
    if (rep.points >= 2500) rep.level = 'Master';
    else if (rep.points >= 1000) rep.level = 'Mentor';
    else if (rep.points >= 500) rep.level = 'Expert';
    else if (rep.points >= 200) rep.level = 'Explorer';
    else if (rep.points >= 50) rep.level = 'Contributor';
    else rep.level = 'Beginner';

    if (reason === 'helpful_answer') rep.helpfulAnswersCount += 1;
    if (reason === 'accepted_answer') rep.acceptedAnswersCount += 1;
    if (reason === 'discussion') rep.discussionsCount += 1;

    await rep.save();
    return rep;
  }

  static async getReputation(userId) {
    let rep = await CommunityReputation.findOne({ userId }).lean();
    if (!rep) {
      rep = await CommunityReputation.create({ userId });
      rep = rep.toObject();
    }
    return rep;
  }
}

module.exports = ReputationService;
