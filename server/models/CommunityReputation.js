/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CommunityReputation.js  —  Reputation & Tier Levels Model
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const CommunityReputationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    points: { type: Number, default: 0 },
    level: {
      type: String,
      enum: ['Beginner', 'Contributor', 'Explorer', 'Expert', 'Mentor', 'Master'],
      default: 'Beginner',
    },
    helpfulAnswersCount: { type: Number, default: 0 },
    acceptedAnswersCount: { type: Number, default: 0 },
    discussionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityReputation', CommunityReputationSchema);
