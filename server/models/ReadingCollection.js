/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReadingCollection.js  —  User Reading Collections & Bookmarked Lists
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ReadingCollectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
    coverImage: { type: String, default: '' },
  },
  { timestamps: true }
);

ReadingCollectionSchema.index({ userId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('ReadingCollection', ReadingCollectionSchema);
