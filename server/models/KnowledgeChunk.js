/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  KnowledgeChunk.js  —  Article Knowledge Chunk Index
 *  MyJourney CMS  |  Stage 3 — Phase 20B: AI Knowledge Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Pre-processed chunks of published article content for fast RAG retrieval.
 *  Each chunk is a semantically meaningful section of one article.
 *
 *  Phase 1 (current):  Keyword + full-text MongoDB search
 *  Phase 2 (future):   Add embedding vector field for semantic/cosine search
 *  Phase 3 (future):   Hybrid search (keyword + semantic with re-ranking)
 *
 *  The schema is designed to support all three phases without breaking changes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const KnowledgeChunkSchema = new mongoose.Schema(
  {
    // Source article
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    articleTitle:  { type: String, required: true },
    articleSlug:   { type: String, required: true, index: true },
    articleStatus: { type: String, index: true }, // must be 'published' for RAG eligibility
    category:      { type: String, index: true },
    tags:          { type: [String], default: [] },

    // Chunk content
    chunkIndex: { type: Number, default: 0 },   // position of this chunk within article
    heading:    { type: String, default: '' },   // section heading if available
    content:    { type: String, required: true }, // the actual text chunk
    charCount:  { type: Number, default: 0 },

    // Phase 2: vector embedding placeholder (null = not yet embedded)
    embedding:  { type: [Number], default: null },
    embeddingModel: { type: String, default: null },

    // Indexing metadata
    indexedAt:  { type: Date, default: Date.now },
    version:    { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// Phase 1: Full-text search
KnowledgeChunkSchema.index(
  { content: 'text', heading: 'text', articleTitle: 'text', tags: 'text' },
  { weights: { heading: 8, articleTitle: 6, tags: 4, content: 1 } }
);

// Safety: RAG should only ever use published chunks
KnowledgeChunkSchema.index({ articleStatus: 1, articleId: 1 });

module.exports = mongoose.model('KnowledgeChunk', KnowledgeChunkSchema);
