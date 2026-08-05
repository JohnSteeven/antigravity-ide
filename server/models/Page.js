/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Page.js  —  Enterprise Page Engine Model
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Configuration-driven page document storing JSON blocks mapped to layout regions,
 *  SEO metadata, scheduling, feature flag gating, role permissions, and revision history.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const PageBlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true }, // Block type key e.g. 'hero', 'gallery', 'rich_text'
    region: { type: String, default: 'mainContent' }, // Region in layout e.g. 'hero', 'mainContent', 'leftSidebar'
    order: { type: Number, default: 0 },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
    cssVariables: { type: mongoose.Schema.Types.Mixed, default: {} },
    responsive: {
      desktop: { type: Boolean, default: true },
      tablet: { type: Boolean, default: true },
      mobile: { type: Boolean, default: true },
    },
    featureFlag: { type: String, default: null },
    roles: { type: [String], default: [] },
    visibility: { type: Boolean, default: true },
  },
  { _id: false }
);

const PageHistorySchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    blocks: [PageBlockSchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    layoutKey: {
      type: String,
      default: 'magazine',
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'password', 'members'],
      default: 'public',
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      canonical: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      twitterCard: { type: String, default: 'summary_large_image' },
      schemaType: { type: String, default: 'WebPage' },
      robots: { type: String, default: 'index, follow' },
      noIndex: { type: Boolean, default: false },
    },
    featuredImage: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishDate: {
      type: Date,
      default: null,
    },
    expireDate: {
      type: Date,
      default: null,
    },
    featureFlag: {
      type: String,
      default: null, // Feature flag gating for the whole page
    },
    permissions: {
      roles: { type: [String], default: [] },
    },
    isSystem: {
      type: Boolean,
      default: false, // True for core system pages (home, about, contact, privacy)
    },
    version: {
      type: Number,
      default: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    blocks: [PageBlockSchema],
    history: [PageHistorySchema],
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

module.exports = mongoose.model('Page', PageSchema);
