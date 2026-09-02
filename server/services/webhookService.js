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
   * Dispatch an event payload to all subscribed webhooks (disabled in private beta).
   */
  static async dispatchEvent() {
    return [{
      error: 'Outbound webhooks are disabled in private beta.',
      delivered: false,
    }];
  }
}

module.exports = WebhookService;
