/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VersionDiff.js  —  Version Control Diff Model
 *  MyJourney CMS  |  Stage 2 — Phase 12: Version Control & Rollback Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores computed structural diffs between version snapshots.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const VersionDiffSchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    fromVersion: {
      type: Number,
      required: true,
    },
    toVersion: {
      type: Number,
      required: true,
    },
    addedFields: {
      type: [String],
      default: [],
    },
    removedFields: {
      type: [String],
      default: [],
    },
    changedFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    summary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VersionDiff', VersionDiffSchema);
