/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReadingProgress.js  —  "Continue Reading" & Scroll Position Tracking Model
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ReadingProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true, index: true },

    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    furthestProgressPercent: { type: Number, default: 0, min: 0, max: 100 },
    lastPosition: { type: Number, default: 0, min: 0 },
    activeReadingSeconds: { type: Number, default: 0, min: 0 },

    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completionSource: { type: String, enum: ['manual', 'auto'], default: null },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One authoritative progress record exists per authenticated reader and Article.
ReadingProgressSchema.index(
  { userId: 1, articleId: 1 },
  {
    unique: true,
    name: 'uniq_reader_progress_user_article',
    partialFilterExpression: { userId: { $type: 'objectId' } },
  }
);
ReadingProgressSchema.index({ userId: 1, lastReadAt: -1 });

module.exports = mongoose.model('ReadingProgress', ReadingProgressSchema);
