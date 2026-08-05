/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KnowledgeNode.js  —  Knowledge Graph Entity Node Model
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const KnowledgeNodeSchema = new mongoose.Schema(
  {
    nodeType: {
      type: String,
      enum: ['article', 'category', 'author', 'topic', 'tag', 'learning_path', 'media', 'comment', 'collection'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    label: { type: String, required: true, trim: true },
    slug: { type: String, default: '' },
    description: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

KnowledgeNodeSchema.index({ nodeType: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.model('KnowledgeNode', KnowledgeNodeSchema);
