/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Poll.js  —  Article & Discussion Polls Model
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const PollOptionSchema = new mongoose.Schema(
  {
    optionText: { type: String, required: true },
    votes: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: true }
);

const PollSchema = new mongoose.Schema(
  {
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    question: { type: String, required: true, trim: true },
    options: [PollOptionSchema],
    isMultipleChoice: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'closed'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poll', PollSchema);
