/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WebhookSubscription.js  —  Webhook Endpoint & Event Subscriptions Model
 *  MyJourney Platform  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const WebhookSubscriptionSchema = new mongoose.Schema(
  {
    targetUrl: { type: String, required: true, trim: true },
    secret: { type: String, required: true }, // HMAC-SHA256 signing secret
    events: [
      {
        type: String,
        enum: [
          'article.published',
          'article.updated',
          'comment.created',
          'membership.upgraded',
          'subscription.cancelled',
          'workflow.approved',
          'ai.job_completed',
          'campaign.published',
        ],
      },
    ],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'paused', 'failed'], default: 'active', index: true },
    failureCount: { type: Number, default: 0 },
    lastDeliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebhookSubscription', WebhookSubscriptionSchema);
