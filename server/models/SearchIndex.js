/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SearchIndex.js  —  Enterprise Universal Search Index Model
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SearchIndexSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['article', 'page', 'category', 'tag', 'author', 'media', 'learning_path', 'discussion', 'form', 'plugin'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, default: '' },
    content: { type: String, default: '' }, // Clean plain text for indexing
    excerpt: { type: String, default: '' },
    category: { type: String, default: '' },
    tags: [{ type: String, lowercase: true, trim: true }],
    author: { type: String, default: '' },
    url: { type: String, required: true },
    accessLevel: { type: String, enum: ['free', 'premium'], default: 'free', index: true },

    // Metrics for relevance boosting
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    score: { type: Number, default: 1.0 },

    isPublic: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Compound text index for weighted full-text search
SearchIndexSchema.index(
  { title: 'text', tags: 'text', content: 'text', category: 'text' },
  { weights: { title: 10, tags: 5, category: 3, content: 1 }, name: 'UniversalTextIndex' }
);

module.exports = mongoose.model('SearchIndex', SearchIndexSchema);
