jest.mock("mongoose", () => ({ startSession: jest.fn() }));
jest.mock("../models/Payment", () => ({ findById: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() }));
jest.mock("../models/ReaderMembership", () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() }));
jest.mock("../models/BillingEvent", () => ({ findOneAndUpdate: jest.fn() }));
jest.mock("../services/billingDomainService", () => ({ ensureInvoiceForCapturedPayment: jest.fn() }));
jest.mock("../services/paymentProviderService", () => ({ capability: jest.fn(() => ({ providerConfigured: false, checkoutAvailable: false })) }));

const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const ReaderMembership = require("../models/ReaderMembership");
const BillingEvent = require("../models/BillingEvent");
const { activateCapturedPayment, revokeFullyRefundedPayment, cancelPaidMembership } = require("../services/premiumLifecycleService");
const { evaluatePremiumAccess } = require("../services/subscriptionService");
const { resolveFromSubscription } = require("../services/entitlementService");
const { serializePublicContent } = require("../premium/contentPreview");
const { priceCatalog } = require("../billing/priceCatalog");
const MonetizationService = require("../services/monetizationService");

const now = new Date("2026-09-18T12:00:00Z");
const query = (value) => ({ session: jest.fn().mockResolvedValue(value) });
const paid = (extra = {}) => ({ _id: "payment-1", userId: "user-1", provider: "razorpay",
  productCode: "PREMIUM_MONTHLY", market: "INDIA", currency: "INR", amountMinor: 39900,
  capturedAmountMinor: 39900, refundedAmountMinor: 0, status: "captured", ...extra });
const period = (start, end, paymentId = "payment-1") => ({ start: new Date(start), end: new Date(end),
  paymentId, source: "payment", billingPeriodMonths: 1, productCode: "PREMIUM_MONTHLY" });
const membership = (extra = {}) => ({ _id: "membership-1", userId: "user-1", plan: "premium",
  provider: "razorpay", billingPeriodMonths: 1, billingStatus: "active",
  currentPeriodStart: new Date("2026-09-01"), currentPeriodEnd: new Date("2026-10-01"), ...extra });

describe("Phase 13 Premium lifecycle", () => {
  let session;
  beforeEach(() => {
    jest.resetAllMocks();
    session = { withTransaction: jest.fn(async (work) => work()), endSession: jest.fn() };
    mongoose.startSession.mockResolvedValue(session);
    Payment.findById.mockReturnValue(query(paid()));
    ReaderMembership.findOne.mockReturnValue(query(null));
    ReaderMembership.findOneAndUpdate.mockImplementation(async (_filter, update) => membership(update.$set));
    Payment.findOneAndUpdate.mockImplementation(async (_filter, update) => paid(update.$set));
    Payment.updateOne.mockResolvedValue({ matchedCount: 1 });
    BillingEvent.findOneAndUpdate.mockResolvedValue({});
  });

  test("verified capture activates catalog-owned dates and records atomic attribution/audit", async () => {
    const result = await activateCapturedPayment("payment-1", now);
    expect(result).toMatchObject({ subscriptionId: "membership-1", entitlementAppliedAt: now,
      entitlementStart: now, entitlementEnd: new Date("2026-10-18T12:00:00Z") });
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(ReaderMembership.findOneAndUpdate.mock.calls[0][2]).toMatchObject({ session, upsert: true });
    expect(BillingEvent.findOneAndUpdate.mock.calls[0][0]).toEqual({ provider: "myjourney", providerEventId: "premium:activate:payment-1" });
    expect(BillingEvent.findOneAndUpdate.mock.calls[0][2]).toMatchObject({ session });
  });

  test.each([
    ["PREMIUM_MONTHLY", 1, "2026-10-18T12:00:00Z"],
    ["PREMIUM_3_MONTH", 3, "2026-12-18T12:00:00Z"],
    ["PREMIUM_6_MONTH", 6, "2027-03-18T12:00:00Z"],
    ["PREMIUM_12_MONTH", 12, "2027-09-18T12:00:00Z"],
  ])("%s uses the exact server catalog duration and USD price", async (productCode, months, end) => {
    const price = priceCatalog.resolve({ productCode, market: "INTERNATIONAL" });
    Payment.findById.mockReturnValue(query(paid({ productCode, market: price.market,
      currency: price.currency, amountMinor: price.amountMinor, capturedAmountMinor: price.amountMinor })));
    expect((await activateCapturedPayment("payment-1", now)).entitlementEnd).toEqual(new Date(end));
    expect(ReaderMembership.findOneAndUpdate.mock.calls[0][1].$set).toMatchObject({
      billingPeriodMonths: months, amountMinor: price.amountMinor, currency: "USD" });
  });

  test("public plan display resolves account market server-side without exposing provider IDs", () => {
    const india = MonetizationService.getPublicCatalog({ countryCode: "+91" });
    const international = MonetizationService.getPublicCatalog({ countryCode: "+1" });
    expect(india.durations.map((entry) => entry.amountMinor)).toEqual([39900, 109900, 199900, 349900]);
    expect(india.durations.every((entry) => entry.currency === "INR" && entry.formattedPrice)).toBe(true);
    expect(international.durations.map((entry) => entry.amountMinor)).toEqual([999, 2799, 4999, 8999]);
    expect(international.durations.every((entry) => entry.currency === "USD")).toBe(true);
    expect(JSON.stringify(india)).not.toMatch(/keySecret|webhookSecret|providerSubscriptionId/);
  });

  test.each(["failed", "pending", "refunded", "authorized"])("%s cannot activate Premium", async (status) => {
    Payment.findById.mockReturnValue(query(paid({ status })));
    await expect(activateCapturedPayment("payment-1", now)).rejects.toMatchObject({ code: "PAYMENT_NOT_CAPTURED" });
    expect(ReaderMembership.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("Payment/catalog mismatch cannot grant client-selected time", async () => {
    Payment.findById.mockReturnValue(query(paid({ amountMinor: 1, capturedAmountMinor: 1 })));
    await expect(activateCapturedPayment("payment-1", now)).rejects.toMatchObject({ code: "PAYMENT_CATALOG_MISMATCH" });
  });

  test("repeated payment processing cannot extend twice", async () => {
    Payment.findById.mockReturnValue(query(paid({ entitlementAppliedAt: now })));
    await activateCapturedPayment("payment-1", now);
    expect(ReaderMembership.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("renewal preserves remaining legacy time, clamps calendar month boundaries", async () => {
    ReaderMembership.findOne.mockReturnValue(query(membership({ currentPeriodEnd: new Date("2027-01-31T12:00:00Z") })));
    const result = await activateCapturedPayment("payment-1", now);
    expect(result.entitlementStart).toEqual(new Date("2027-01-31T12:00:00Z"));
    expect(result.entitlementEnd).toEqual(new Date("2027-02-28T12:00:00Z"));
    expect(ReaderMembership.findOneAndUpdate.mock.calls[0][1].$set.paidPeriods).toHaveLength(2);
  });

  test("renewal after expiry begins at verification time", async () => {
    ReaderMembership.findOne.mockReturnValue(query(membership({ billingStatus: "expired", currentPeriodEnd: new Date("2026-09-01") })));
    expect((await activateCapturedPayment("payment-1", now)).entitlementStart).toEqual(now);
  });

  test("fully refunded purchase removes only its attributed period", async () => {
    ReaderMembership.findOne.mockReturnValue(query(membership({ paidPeriods: [
      period("2026-09-01", "2026-10-01"), period("2026-09-10", "2026-11-01", "payment-2"),
    ] })));
    await revokeFullyRefundedPayment({ payment: paid({ entitlementAppliedAt: now }), processedAt: now, session });
    const state = ReaderMembership.findOneAndUpdate.mock.calls[0][1].$set;
    expect(state.paidPeriods.map((entry) => entry.paymentId)).toEqual(["payment-2"]);
    expect(evaluatePremiumAccess(membership(state), now).active).toBe(true);
  });

  test("refund gaps and future windows never grant early access", () => {
    const state = membership({ paidPeriods: [period("2026-10-01", "2026-11-01", "payment-2")] });
    expect(evaluatePremiumAccess(state, now)).toEqual({ active: false, reason: "period_not_started" });
    expect(evaluatePremiumAccess(state, new Date("2026-10-01")).active).toBe(true);
    expect(evaluatePremiumAccess(state, new Date("2026-11-01")).active).toBe(false);
    expect(resolveFromSubscription(state, now).nextAccessStart).toEqual(new Date("2026-10-01"));
  });

  test("cancellation audit and state share a transaction and preserve paid access", async () => {
    ReaderMembership.findOne.mockReturnValue(query(membership()));
    const state = await cancelPaidMembership("user-1", now);
    expect(state.cancelAtPeriodEnd).toBe(true);
    expect(evaluatePremiumAccess(state, now).active).toBe(true);
    expect(BillingEvent.findOneAndUpdate.mock.calls[0][2].session).toBe(session);
  });

  test("recurring provider cancellation stays unavailable", async () => {
    ReaderMembership.findOne.mockReturnValue(query(membership({ providerSubscriptionId: "sub_provider" })));
    await expect(cancelPaidMembership("user-1", now)).rejects.toMatchObject({ code: "BILLING_PROVIDER_UNAVAILABLE" });
    expect(ReaderMembership.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("paid access survives failed renewal without inventing grace", () => {
    const state = membership({ billingStatus: "past_due", graceUntil: null });
    expect(evaluatePremiumAccess(state, now).active).toBe(true);
    expect(evaluatePremiumAccess(state, new Date("2026-10-01")).active).toBe(false);
  });

  test("account serializer exposes safe authoritative membership fields only", () => {
    const state = membership({ startedAt: now, providerCustomerId: "private-customer",
      providerSubscriptionId: null, latestPaymentId: "private-payment", metadata: { secret: "private" },
      paidPeriods: [period("2026-09-01", "2026-10-01")],
      lastPaymentIssue: { status: "failed", occurredAt: now, paymentId: "private-failure" } });
    const result = resolveFromSubscription(state, now);
    expect(result).toMatchObject({ active: true, autoRenew: false, billingMode: "prepaid_term",
      startedAt: now, paymentIssue: { status: "failed", occurredAt: now } });
    expect(JSON.stringify(result)).not.toMatch(/private|paidPeriods|latestPayment|providerCustomer|providerSubscription/);
  });

  test.each([null, membership(), membership({ currentPeriodEnd: now }), membership({ paidPeriods: [] })])(
    "contentPreview uses canonical entitlement decision", (state) => {
      const access = resolveFromSubscription(state, now);
      const content = serializePublicContent({ accessLevel: "premium", body: "<p>PRIVATE BODY</p>",
        storySections: [{ body: "PRIVATE SECTION" }], structuredBlocks: [{ text: "PRIVATE BLOCK" }] },
      { canAccessPremium: access.entitlements.premium_content });
      expect(JSON.stringify(content).includes("PRIVATE BODY")).toBe(access.active);
      expect(JSON.stringify(content).includes("PRIVATE SECTION")).toBe(access.active);
      expect(JSON.stringify(content).includes("PRIVATE BLOCK")).toBe(access.active);
    });
});
