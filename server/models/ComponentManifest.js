/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ComponentManifest.js  —  Component Manifest Model
 *  MyJourney CMS  |  Phase 8: Component Library & Block Marketplace
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single manifest contract for every component block specifying props schema,
 *  category, supported layout regions, design tokens, feature flag compatibility,
 *  and role permissions.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const PropSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'number', 'boolean', 'select', 'color', 'media', 'array', 'object'], default: 'text' },
    label: { type: String, required: true },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: '' },
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const ComponentManifestSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['Content', 'Marketing', 'Articles', 'Community', 'Media', 'Layout', 'Utility'],
      default: 'Content',
      index: true,
    },
    icon: {
      type: String,
      default: 'Box',
    },
    description: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['published', 'beta', 'archived'],
      default: 'published',
      index: true,
    },
    isBuiltIn: {
      type: Boolean,
      default: true,
    },
    propSchema: {
      props: [PropSchema],
    },
    defaultProps: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    supportedRegions: {
      type: [String],
      default: ['mainContent', 'hero', 'leftSidebar', 'rightSidebar', 'bottomSection'],
    },
    featureFlag: {
      type: String,
      default: null,
    },
    roles: {
      type: [String],
      default: [],
    },
    designTokens: {
      type: [String],
      default: ['color.primary', 'color.text', 'space.md', 'radius.md'],
    },
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

module.exports = mongoose.model('ComponentManifest', ComponentManifestSchema);
