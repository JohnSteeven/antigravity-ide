/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KnowledgeEdge.js  —  Knowledge Graph Directed Relationship Edge Model
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const KnowledgeEdgeSchema = new mongoose.Schema(
  {
    sourceNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode', required: true, index: true },
    targetNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode', required: true, index: true },
    relationType: {
      type: String,
      enum: [
        'RELATED_TO',
        'WRITTEN_BY',
        'BELONGS_TO',
        'REFERENCES',
        'PREREQUISITE',
        'NEXT_STEP',
        'SIMILAR',
        'MENTIONS',
        'USES',
        'GENERATED_FROM',
      ],
      required: true,
      index: true,
    },
    weight: { type: Number, default: 1.0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

KnowledgeEdgeSchema.index({ sourceNodeId: 1, targetNodeId: 1, relationType: 1 }, { unique: true });

module.exports = mongoose.model('KnowledgeEdge', KnowledgeEdgeSchema);
