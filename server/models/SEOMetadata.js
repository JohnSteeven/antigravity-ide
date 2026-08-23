/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SEOMetadata.js  —  Enterprise SEO Metadata Model
 *  MyJourney CMS  |  Stage 2 — Phase 17: SEO Intelligence & Structured Data
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single source of truth model storing SEO meta titles, meta descriptions,
 *  canonical URLs, Open Graph / Twitter Card tags, JSON-LD schemas, and SEO scores.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SEOIssueSchema = new mongoose.Schema(
  {
    severity: { type: String, enum: ['info', 'warning', 'error'], default: 'warning' },
    message: { type: String, required: true },
  },
  { _id: false }
);

const SEOMetadataSchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true, // e.g. 'article', 'page', 'headless_entry', 'category'
      index: true,
    },
    metaTitle: {
      type: String,
      default: '',
      trim: true,
    },
    metaDescription: {
      type: String,
      default: '',
      trim: true,
    },
    canonicalUrl: {
      type: String,
      default: '',
    },
    ogTitle: {
      type: String,
      default: '',
    },
    ogDescription: {
      type: String,
      default: '',
    },
    ogImage: {
      type: String,
      default: '',
    },
    twitterCard: {
      type: String,
      default: 'summary_large_image',
    },
    keywords: {
      type: [String],
      default: [],
    },
    jsonLdType: {
      type: String,
      default: 'Article',
    },
    seoScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    issues: [SEOIssueSchema],
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

SEOMetadataSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.model('SEOMetadata', SEOMetadataSchema);
