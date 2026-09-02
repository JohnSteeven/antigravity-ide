/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SystemSetting.js  —  Enterprise Dynamic System Setting Model
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores key-value setting documents with metadata, field schemas,
 *  isSecret flags for encryption masking, group definitions, and revision tracking.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SettingAuditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    action: { type: String, default: 'update' },
    changes: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SystemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      enum: ['General', 'SEO', 'Theme', 'Email', 'Analytics', 'Security', 'Social', 'Performance', 'Search', 'Media', 'Plugins', 'AI'],
      index: true,
    },
    group: {
      type: String,
      default: 'Main',
    },
    icon: {
      type: String,
      default: 'Settings',
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    schema: {
      type: mongoose.Schema.Types.Mixed, // Field definitions schema
      default: {},
    },
    isSecret: {
      type: Boolean,
      default: false, // If true, sensitive fields in value are masked on API read
    },
    secretFields: {
      type: [String], // Field names within value to mask (e.g. ['password', 'apiKey'])
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false, // Protects core system settings from deletion
    },
    version: {
      type: Number,
      default: 1,
    },
    audit: [SettingAuditSchema],
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

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
