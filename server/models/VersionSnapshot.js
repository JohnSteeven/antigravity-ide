/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VersionSnapshot.js  —  Unified Version Control Snapshot Model
 *  MyJourney CMS  |  Stage 2 — Phase 12: Version Control & Rollback Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single source of truth snapshot model storing immutable version history for
 *  Articles, Pages, Headless Entries, Layouts, Themes, Navigation, Settings,
 *  Design Tokens, and Component Manifests.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const VersionSnapshotSchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true, // e.g. 'article', 'page', 'headless_entry', 'layout', 'theme', 'navigation', 'setting', 'design_token', 'component_manifest'
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: '',
    },
    serializedData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    checksum: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tags: {
      type: [String],
      default: [], // e.g. ['Launch', 'SEO Update', 'Spring Campaign']
    },
    notes: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    rollbackFrom: {
      type: Number,
      default: null, // References version number if created via restore action
    },
  },
  {
    timestamps: true,
  }
);

VersionSnapshotSchema.index({ entityType: 1, entityId: 1, versionNumber: -1 });

module.exports = mongoose.model('VersionSnapshot', VersionSnapshotSchema);
