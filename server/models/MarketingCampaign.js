/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MarketingCampaign.js  —  Marketing Campaign & Omnichannel Launcher Model
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const MarketingCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['article_launch', 'weekly_digest', 'newsletter', 'seasonal', 'product_launch', 'custom'],
      default: 'article_launch',
    },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
    status: { type: String, enum: ['draft', 'scheduled', 'active', 'completed'], default: 'draft', index: true },
    channels: [{ type: String, enum: ['social', 'email', 'push', 'rss'] }],
    scheduledAt: { type: Date, default: null },
    reach: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarketingCampaign', MarketingCampaignSchema);
