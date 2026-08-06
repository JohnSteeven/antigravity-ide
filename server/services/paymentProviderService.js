/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  paymentProviderService.js  —  Abstract Payment Provider Adapter Layer
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Supports Stripe, LemonSqueezy, and Paddle under a unified interface.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

class PaymentProviderService {
  /**
   * Create checkout session for plan upgrade (disabled in private beta).
   */
  static async createCheckoutSession() {
    const err = new Error('Payments and membership checkout are disabled in private beta.');
    err.status = 503;
    throw err;
  }

  /**
   * Cancel subscription with provider (disabled in private beta).
   */
  static async cancelSubscription() {
    const err = new Error('Payments and membership service are disabled in private beta.');
    err.status = 503;
    throw err;
  }
}

module.exports = PaymentProviderService;
