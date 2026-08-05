/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PublishingJob.js  —  Scheduled Publishing Job Model
 *  MyJourney CMS  |  Stage 2 — Phase 11: Enterprise Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Scheduled publishing and unpublishing queue jobs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const PublishingJobSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['publish', 'unpublish', 'archive'],
      default: 'publish',
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    errorDetails: {
      type: String,
      default: '',
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

module.exports = mongoose.model('PublishingJob', PublishingJobSchema);
