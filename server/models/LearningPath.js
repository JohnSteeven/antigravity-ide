/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LearningPath.js  —  Structured Learning Journeys Model
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const LearningStepSchema = new mongoose.Schema(
  {
    stepOrder: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
    articleSlug: { type: String, default: '' },
  },
  { _id: false }
);

const LearningPathSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    icon: { type: String, default: 'book' },
    coverImage: { type: String, default: '' },
    steps: [LearningStepSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningPath', LearningPathSchema);
