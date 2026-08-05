/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FeatureFlag.js  —  Enterprise Feature Flag Model
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Supports multi-state evaluation: enabled, disabled, beta, maintenance, private, public.
 *  Supports role-based gating, environment-gating, percentage rollouts,
 *  scheduled dates, and feature dependency tracking.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const FeatureFlagAuditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    oldStatus: { type: String },
    newStatus: { type: String },
    reason: { type: String },
    environment: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FeatureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    group: {
      type: String,
      default: 'General',
      enum: ['Core', 'Content', 'Experience', 'Marketing', 'Operations', 'Plugins', 'General', 'Future'],
    },
    status: {
      type: String,
      enum: ['enabled', 'disabled', 'beta', 'maintenance', 'private', 'public'],
      default: 'enabled',
      index: true,
    },
    allowedRoles: {
      type: [String],
      default: ['admin', 'editor'],
    },
    allowedEnvironments: {
      type: [String],
      default: ['development', 'staging', 'production'],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    percentageRollout: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    dependencies: {
      type: [String], // Array of feature keys this feature depends on
      default: [],
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    audit: [FeatureFlagAuditSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FeatureFlag', FeatureFlagSchema);
