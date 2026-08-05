/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReadingProgress.js  —  "Continue Reading" & Scroll Position Tracking Model
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ReadingProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, default: null, index: true }, // Anonymous session tracking
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    articleSlug: { type: String, required: true },

    scrollPositionPx: { type: Number, default: 0 },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    timeSpentSeconds: { type: Number, default: 0 },
    deviceType: { type: String, default: 'desktop' },

    isCompleted: { type: Boolean, default: false },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to quickly find user's latest progress per article
ReadingProgressSchema.index({ userId: 1, articleId: 1 });
ReadingProgressSchema.index({ sessionId: 1, articleId: 1 });
ReadingProgressSchema.index({ userId: 1, lastReadAt: -1 });

module.exports = mongoose.model('ReadingProgress', ReadingProgressSchema);
