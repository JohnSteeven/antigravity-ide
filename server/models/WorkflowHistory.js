/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WorkflowHistory.js  —  Workflow Transition History Model
 *  MyJourney CMS  |  Stage 2 — Phase 11: Enterprise Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Audit history of all workflow state transitions across Articles, Pages,
 *  and Headless Content Entries.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const WorkflowHistorySchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true, // e.g. 'article', 'page', 'content_entry'
      index: true,
    },
    fromState: {
      type: String,
      required: true,
    },
    toState: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

WorkflowHistorySchema.index({ contentType: 1, contentId: 1, timestamp: -1 });

module.exports = mongoose.model('WorkflowHistory', WorkflowHistorySchema);
