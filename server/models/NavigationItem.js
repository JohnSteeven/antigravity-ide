/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NavigationItem.js  —  Enterprise Navigation Item Model
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores hierarchical navigation tree items with feature flag gating,
 *  role restrictions, badges, mega menu layouts, and click analytics.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const NavigationItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    zoneKey: {
      type: String,
      required: true,
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NavigationItem',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['internal', 'external', 'category', 'article', 'dropdown', 'mega', 'button', 'separator', 'label', 'auto_categories'],
      default: 'internal',
    },
    internalRoute: {
      type: String,
      default: '/',
    },
    externalUrl: {
      type: String,
      default: '',
    },
    target: {
      type: String,
      enum: ['_self', '_blank'],
      default: '_self',
    },
    icon: {
      type: String,
      default: '',
    },
    badge: {
      text: { type: String, default: '' },
      color: { type: String, default: '#2e7d5a' },
    },
    description: {
      type: String,
      default: '',
    },
    featureFlag: {
      type: String,
      default: null, // Optional feature flag gating
    },
    roles: {
      type: [String],
      default: [], // Empty means visible to all roles
    },
    environments: {
      type: [String],
      default: ['development', 'staging', 'production'],
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
    },
    isMegaMenu: {
      type: Boolean,
      default: false,
    },
    megaLayout: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    clicks: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
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

NavigationItemSchema.index({ zoneKey: 1, parent: 1, sortOrder: 1 });

module.exports = mongoose.model('NavigationItem', NavigationItemSchema);
