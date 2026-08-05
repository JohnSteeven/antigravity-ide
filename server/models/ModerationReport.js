/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ModerationReport.js  —  Discussion Moderation Queue & Spam Model
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ModerationReportSchema = new mongoose.Schema(
  {
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true, index: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'auto_hidden'],
      default: 'pending',
      index: true,
    },
    aiToxicityScore: { type: Number, default: 0 },
    moderatorNotes: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ModerationReport', ModerationReportSchema);
