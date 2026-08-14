const ReaderMembership = require("../models/ReaderMembership");
const { getPublicDurationCatalog, PREMIUM_BENEFITS } = require("../premium/catalog");
const PaymentProviderService = require("./paymentProviderService");

class MonetizationService {
  static getPublicCatalog() {
    return {
      product: { plan: "premium", name: "MyJourney Premium", benefits: PREMIUM_BENEFITS },
      durations: getPublicDurationCatalog(),
      billing: PaymentProviderService.capability(),
    };
  }

  static async getRevenueStats() {
    const [activeSubscribers, totalMemberships] = await Promise.all([
      ReaderMembership.countDocuments({ plan: "premium", billingStatus: { $in: ["active", "trialing", "past_due", "grace_period", "cancel_pending", "canceled"] } }),
      ReaderMembership.countDocuments({}),
    ]);
    return {
      mrr: null,
      arr: null,
      revenueConfigured: false,
      activeSubscribers,
      totalMemberships,
      paidProducts: 1,
    };
  }
}

module.exports = MonetizationService;
