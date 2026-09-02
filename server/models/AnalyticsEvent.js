/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AnalyticsEvent.js  —  Content Analytics Event Model
 *  MyJourney CMS  |  Stage 2 — Phase 18: Content Intelligence & Reader Analytics
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Asynchronous analytics event store tracking views, reading duration,
 *  scroll depth, bookmarks, shares, and conversion funnels.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: ['page_view', 'article_read', 'scroll_depth', 'bookmark', 'share', 'comment', 'search', 'lead_conversion'],
      required: true,
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    contentType: {
      type: String,
      default: 'article',
      index: true,
    },
    readerId: {
      type: String,
      default: 'anonymous',
    },
    durationSec: {
      type: Number,
      default: 0,
    },
    scrollPercent: {
      type: Number,
      default: 0,
    },
    referrer: {
      type: String,
      default: '',
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
