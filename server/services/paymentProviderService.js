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
   * Create checkout session for plan upgrade.
   */
  static async createCheckoutSession({ provider = 'stripe', plan, userId, userEmail, returnUrl }) {
    switch (provider) {
      case 'lemonsqueezy':
        return {
          provider: 'lemonsqueezy',
          checkoutUrl: `https://lemonsqueezy.com/checkout/mock?plan=${plan.slug}&user=${userId}`,
          sessionId: `ls_chk_${Date.now()}`,
        };
      case 'paddle':
        return {
          provider: 'paddle',
          checkoutUrl: `https://checkout.paddle.com/mock?plan=${plan.slug}&user=${userId}`,
          sessionId: `pad_chk_${Date.now()}`,
        };
      case 'stripe':
      default:
        return {
          provider: 'stripe',
          checkoutUrl: `https://checkout.stripe.com/mock?plan=${plan.slug}&user=${userId}`,
          sessionId: `str_chk_${Date.now()}`,
        };
    }
  }

  /**
   * Cancel subscription with provider.
   */
  static async cancelSubscription({ provider, subscriptionId }) {
    return { success: true, provider, subscriptionId, canceledAt: new Date() };
  }
}

module.exports = PaymentProviderService;
