/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  paymentProviderService.js  —  Abstract Payment Provider Adapter Layer
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Provider-independent boundary. No provider is configured in this pass.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

class PaymentProviderService {
  static unavailable(operation) {
    const err = new Error(`Billing provider is not configured for ${operation}.`);
    err.status = 503;
    err.code = 'BILLING_PROVIDER_UNAVAILABLE';
    throw err;
  }

  static async createCheckoutSession() { return this.unavailable('checkout'); }
  static async createCustomerPortalSession() { return this.unavailable('customer portal'); }
  static async cancelAtPeriodEnd() { return this.unavailable('cancellation'); }
  static async resumeSubscription() { return this.unavailable('resumption'); }
  static async getSubscription() { return this.unavailable('subscription synchronization'); }
  static async handleWebhookEvent() { return this.unavailable('webhook processing'); }
  static mapProviderStatus() { return this.unavailable('status mapping'); }
  static mapProviderPriceToDuration() { return this.unavailable('price mapping'); }

  static capability() {
    return { providerConfigured: false, checkoutAvailable: false, portalAvailable: false, webhookAvailable: false };
  }
}

module.exports = PaymentProviderService;
