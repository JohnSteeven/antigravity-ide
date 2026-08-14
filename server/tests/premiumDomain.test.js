const { BILLING_PERIODS, ENTITLEMENTS, PREMIUM_ENTITLEMENTS, getPublicDurationCatalog } = require("../premium/catalog");
const { evaluatePremiumAccess } = require("../services/subscriptionService");
const { resolveFromSubscription } = require("../services/entitlementService");
const PaymentProviderService = require("../services/paymentProviderService");
const { addCalendarMonths, buildSubscriptionFixture, persistDevelopmentFixture } = require("../premium/fixtures");

const now = new Date("2026-08-14T00:00:00.000Z");
const active = (months = 1, extra = {}) => ({
  plan: "premium",
  billingPeriodMonths: months,
  billingStatus: "active",
  currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
  currentPeriodEnd: new Date("2027-08-01T00:00:00.000Z"),
  ...extra,
});

describe("MyJourney Premium subscription domain", () => {
  test("the public duration catalog contains exactly 1, 3, 6, and 12 months without invented prices", () => {
    const catalog = getPublicDurationCatalog();
    expect(catalog.map((item) => item.billingPeriodMonths)).toEqual([1, 3, 6, 12]);
    expect(catalog.every((item) => item.plan === "premium" && item.price === null && item.checkoutAvailable === false)).toBe(true);
  });

  test("all four active durations resolve to identical Premium entitlements", () => {
    const resolutions = BILLING_PERIODS.map((months) => resolveFromSubscription(active(months), now));
    resolutions.forEach((resolution) => {
      expect(resolution.plan).toBe("premium");
      expect(Object.entries(resolution.entitlements).filter(([, enabled]) => enabled).map(([key]) => key).sort())
        .toEqual([...PREMIUM_ENTITLEMENTS].sort());
    });
    expect(new Set(resolutions.map((resolution) => JSON.stringify(resolution.entitlements))).size).toBe(1);
  });

  test("Free and incomplete records do not grant Premium", () => {
    expect(resolveFromSubscription(null, now).plan).toBe("free");
    expect(evaluatePremiumAccess({ plan: "free" }, now).active).toBe(false);
    expect(evaluatePremiumAccess(active(1, { billingStatus: "incomplete" }), now).active).toBe(false);
  });

  test("valid trial and grace windows grant the same Premium access", () => {
    const trial = active(3, { billingStatus: "trialing", trialEnd: new Date("2026-09-01T00:00:00.000Z") });
    const grace = active(6, { billingStatus: "past_due", graceUntil: new Date("2026-08-20T00:00:00.000Z") });
    expect(evaluatePremiumAccess(trial, now)).toMatchObject({ active: true, reason: "trial" });
    expect(evaluatePremiumAccess(grace, now)).toMatchObject({ active: true, reason: "grace" });
    expect(resolveFromSubscription(trial, now).entitlements[ENTITLEMENTS.LIFE_ACCESS]).toBe(true);
    expect(resolveFromSubscription(grace, now).entitlements[ENTITLEMENTS.PREMIUM_CONTENT]).toBe(true);
  });

  test.each(BILLING_PERIODS)("cancellation for %i months retains access through the paid period", (months) => {
    const canceled = active(months, { billingStatus: "cancel_pending", cancelAtPeriodEnd: true });
    expect(evaluatePremiumAccess(canceled, now)).toMatchObject({ active: true, reason: "paid_period" });
  });

  test("period boundaries, expired trials, and expired grace fail closed", () => {
    const boundary = new Date(now);
    expect(evaluatePremiumAccess(active(1, { currentPeriodEnd: boundary }), now).active).toBe(false);
    expect(evaluatePremiumAccess(active(1, { billingStatus: "trialing", trialEnd: boundary }), now).active).toBe(false);
    expect(evaluatePremiumAccess(active(1, { billingStatus: "grace_period", graceUntil: boundary }), now).active).toBe(false);
    expect(evaluatePremiumAccess(active(1, { billingStatus: "expired" }), now).active).toBe(false);
  });

  test("resubscription and a future duration change do not create a different feature tier", () => {
    const renewed = active(12, { nextBillingPeriodMonths: 3, billingStatus: "active" });
    const resolution = resolveFromSubscription(renewed, now);
    expect(resolution.plan).toBe("premium");
    expect(resolution.billingPeriodMonths).toBe(12);
    expect(resolution.entitlements[ENTITLEMENTS.LIFE_ACCESS]).toBe(true);
  });

  test("calendar-month fixtures do not approximate longer periods as fixed days", () => {
    expect(addCalendarMonths(new Date("2026-01-31T10:00:00.000Z"), 1).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(buildSubscriptionFixture({ billingPeriodMonths: 12, now }).currentPeriodEnd.toISOString()).toBe("2027-08-14T00:00:00.000Z");
  });

  test("the provider boundary cannot pretend checkout exists", async () => {
    expect(PaymentProviderService.capability()).toMatchObject({ providerConfigured: false, checkoutAvailable: false, webhookAvailable: false });
    await expect(PaymentProviderService.createCheckoutSession()).rejects.toMatchObject({ status: 503, code: "BILLING_PROVIDER_UNAVAILABLE" });
  });

  test("development Premium persistence is disabled in production", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    await expect(persistDevelopmentFixture({ userId: "000000000000000000000001" })).rejects.toMatchObject({ code: "DEVELOPMENT_PREMIUM_DISABLED" });
    if (original === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original;
  });
});
