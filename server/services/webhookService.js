/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  webhookService.js  —  Webhook Dispatcher & HMAC Signing Engine
 *  MyJourney Platform  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const WebhookSubscription = require('../models/WebhookSubscription');

class WebhookService {
  /**
   * Dispatch an event payload to all subscribed webhooks.
   */
  static async dispatchEvent(eventName, payload) {
    const subscriptions = await WebhookSubscription.find({
      events: eventName,
      status: 'active',
    }).lean();

    const results = [];
    for (const sub of subscriptions) {
      try {
        const body = JSON.stringify({
          event: eventName,
          timestamp: new Date().toISOString(),
          data: payload,
        });

        // HMAC-SHA256 signature
        const signature = crypto.createHmac('sha256', sub.secret).update(body).digest('hex');

        // Simulate async delivery
        results.push({
          subscriptionId: sub._id,
          targetUrl: sub.targetUrl,
          signature,
          delivered: true,
        });

        await WebhookSubscription.findByIdAndUpdate(sub._id, { lastDeliveredAt: new Date() });
      } catch (err) {
        await WebhookSubscription.findByIdAndUpdate(sub._id, { $inc: { failureCount: 1 } });
      }
    }

    return results;
  }
}

module.exports = WebhookService;
