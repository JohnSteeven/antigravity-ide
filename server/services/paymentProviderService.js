/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  paymentProviderService.js  —  Abstract Payment Provider Adapter Layer
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Provider-independent boundary. Phase 12 enables Razorpay test mode only.
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

  static razorpay() {
    const { RazorpayBillingService } = require("./razorpayBillingService");
    return new RazorpayBillingService();
  }

  static async createCheckoutSession(input) {
    const adapter = this.razorpay();
    if (!adapter.capability().checkoutAvailable) return this.unavailable('checkout');
    return adapter.createCheckoutSession(input);
  }
  static async createCustomerPortalSession() { return this.unavailable('customer portal'); }
  static async cancelAtPeriodEnd() { return this.unavailable('cancellation'); }
  static async resumeSubscription() { return this.unavailable('resumption'); }
  static async getSubscription() { return this.unavailable('subscription synchronization'); }
  static async handleWebhookEvent(input) {
    const adapter = this.razorpay();
    if (!adapter.capability().webhookAvailable) return this.unavailable('webhook processing');
    return adapter.handleWebhook(input);
  }
  static mapProviderStatus() { return this.unavailable('status mapping'); }
  static mapProviderPriceToDuration() { return this.unavailable('price mapping'); }

  static capability() {
    return this.razorpay().capability();
  }
}

module.exports = PaymentProviderService;
