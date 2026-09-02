/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WorkerStatus.js  —  Background Queue Worker & Job Status Model
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const WorkerStatusSchema = new mongoose.Schema(
  {
    jobType: {
      type: String,
      enum: ['publishing', 'ai_generation', 'search_indexing', 'email_digest', 'media_processing', 'backup'],
      required: true,
      index: true,
    },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'completed', index: true },
    durationMs: { type: Number, default: 0 },
    retries: { type: Number, default: 0 },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkerStatus', WorkerStatusSchema);
