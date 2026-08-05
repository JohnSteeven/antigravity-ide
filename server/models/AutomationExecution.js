/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AutomationExecution.js  —  Automation Execution Log Model
 *  MyJourney CMS  |  Stage 2 — Phase 13: Content Scheduler & Automation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Detailed execution metrics log tracking started time, finished time,
 *  duration, result, error trace, and metadata.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const AutomationExecutionSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutomationJob',
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    result: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    error: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AutomationExecution', AutomationExecutionSchema);
