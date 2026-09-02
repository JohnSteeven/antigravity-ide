/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WidgetDefinition.js  —  Widget Registry Definition Model
 *  MyJourney CMS  |  Stage 2 — Phase 16: Dashboard & Widget Platform
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single source of truth model storing widget registry definitions, categories,
 *  default sizes, and permissions.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const WidgetDefinitionSchema = new mongoose.Schema(
  {
    widgetId: {
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
    category: {
      type: String,
      enum: ['Content', 'Marketing', 'Workflow', 'Media', 'SEO', 'Analytics', 'Automation', 'System', 'AI', 'Plugins'],
      default: 'System',
      index: true,
    },
    icon: {
      type: String,
      default: 'Grid',
    },
    defaultSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'full'],
      default: 'medium',
    },
    permissions: {
      type: [String],
      default: [],
    },
    refreshInterval: {
      type: Number,
      default: 60, // seconds
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WidgetDefinition', WidgetDefinitionSchema);
