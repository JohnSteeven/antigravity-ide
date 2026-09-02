/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AutomationJob.js  —  Enterprise Automation Job Model
 *  MyJourney CMS  |  Stage 2 — Phase 13: Content Scheduler & Automation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores scheduled automation jobs (publish, unpublish, archive, feature,
 *  reindex, cache clear) with recurrence, retry counts, and execution logs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const JobLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message: { type: String, required: true },
  },
  { _id: false }
);

const AutomationJobSchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true, // e.g. 'article', 'page', 'headless_entry', 'layout', 'theme', 'navigation'
      index: true,
    },
    action: {
      type: String,
      enum: ['publish', 'unpublish', 'archive', 'restore', 'feature', 'unfeature', 'toggle_flag', 'clear_cache', 'reindex'],
      default: 'publish',
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    recurrence: {
      type: String,
      enum: ['once', 'hourly', 'daily', 'weekly', 'monthly', 'cron'],
      default: 'once',
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastRun: {
      type: Date,
      default: null,
    },
    nextRun: {
      type: Date,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    logs: [JobLogSchema],
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

AutomationJobSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('AutomationJob', AutomationJobSchema);
