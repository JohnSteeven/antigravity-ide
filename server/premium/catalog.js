const PLANS = Object.freeze({
  FREE: "free",
  PREMIUM: "premium",
});

const BILLING_PERIODS = Object.freeze([1, 3, 6, 12]);

const BILLING_DURATION_CATALOG = Object.freeze([
  { billingPeriodMonths: 1, displayLabel: "1 Month" },
  { billingPeriodMonths: 3, displayLabel: "3 Months" },
  { billingPeriodMonths: 6, displayLabel: "6 Months" },
  { billingPeriodMonths: 12, displayLabel: "1 Year" },
]);

const ENTITLEMENTS = Object.freeze({
  PREMIUM_CONTENT: "premium_content",
  LIFE_ACCESS: "life_access",
  ADVANCED_LIFE_INSIGHTS: "advanced_life_insights",
  PREMIUM_AI: "premium_ai",
  PREMIUM_AUDIO: "premium_audio",
  PREMIUM_DOWNLOADS: "premium_downloads",
  PREMIUM_LEARN: "premium_learn",
  PREMIUM_CREATOR_CONTENT: "premium_creator_content",
  FUTURE_FEATURE: "future_feature",
});

// Feature access belongs to the Premium product, never to a billing duration.
const PREMIUM_ENTITLEMENTS = Object.freeze(Object.values(ENTITLEMENTS));

const SUBSCRIPTION_STATUSES = Object.freeze([
  "active",
  "trialing",
  "past_due",
  "grace_period",
  "cancel_pending",
  "canceled",
  "expired",
  "incomplete",
]);

const PREMIUM_BENEFITS = Object.freeze([
  "Premium Articles",
  "Premium Stories",
  "MyJourney Life",
  "Advanced Life insights",
  "Future included Premium experiences",
]);

const getPublicDurationCatalog = () => BILLING_DURATION_CATALOG.map((duration) => ({
  ...duration,
  plan: PLANS.PREMIUM,
  price: null,
  currency: null,
  providerPriceId: null,
  priceConfigured: false,
  checkoutAvailable: false,
}));

module.exports = {
  BILLING_DURATION_CATALOG,
  BILLING_PERIODS,
  ENTITLEMENTS,
  PLANS,
  PREMIUM_BENEFITS,
  PREMIUM_ENTITLEMENTS,
  SUBSCRIPTION_STATUSES,
  getPublicDurationCatalog,
};
