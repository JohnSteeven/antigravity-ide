/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PluginManifest.js  —  Enterprise Plugin Manifest Model
 *  MyJourney CMS  |  Stage 2 — Phase 15: Plugin Manager & Extension Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single source of truth model storing plugin manifests, lifecycle state
 *  (installed, active, inactive), dependencies, permissions, and settings.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const PluginManifestSchema = new mongoose.Schema(
  {
    pluginId: {
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
    version: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    description: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      default: 'MyJourney Ecosystem',
    },
    website: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Content', 'Marketing', 'Analytics', 'SEO', 'Media', 'AI', 'Authentication', 'Workflow', 'Payment', 'Integration', 'Utility'],
      default: 'Utility',
      index: true,
    },
    icon: {
      type: String,
      default: 'Box',
    },
    status: {
      type: String,
      enum: ['installed', 'active', 'inactive', 'uninstalled', 'error'],
      default: 'active',
      index: true,
    },
    dependencies: {
      type: [String],
      default: [],
    },
    minCmsVersion: {
      type: String,
      default: '1.0.0',
    },
    permissions: {
      type: [String],
      default: [],
    },
    registeredHooks: {
      type: [String],
      default: [], // e.g. ['afterPublish', 'beforeCreate', 'beforeWorkflow']
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

module.exports = mongoose.model('PluginManifest', PluginManifestSchema);
