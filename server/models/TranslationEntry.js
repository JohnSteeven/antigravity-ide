/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TranslationEntry.js  —  Entity Translation Entry Model
 *  MyJourney CMS  |  Stage 2 — Phase 19: Localization & Translation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores translated field values (title, content, metaTitle, description)
 *  for any content entity per locale.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const TranslationEntrySchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true, // e.g. 'article', 'page', 'category', 'navigation', 'form'
      index: true,
    },
    locale: {
      type: String,
      required: true,
      index: true,
    },
    translatedFields: {
      type: mongoose.Schema.Types.Mixed,
      required: true, // e.g. { title, content, metaTitle, metaDescription }
    },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    progressPercent: {
      type: Number,
      default: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TranslationEntrySchema.index({ entityType: 1, entityId: 1, locale: 1 }, { unique: true });

module.exports = mongoose.model('TranslationEntry', TranslationEntrySchema);
