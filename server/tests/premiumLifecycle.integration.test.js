// Real Mongo transactions/concurrent writes, with provider HTTP stubbed only.
const mongoose = require("mongoose");
const express = require("express");
const request = require("supertest");
const Payment = require("../models/Payment");
const ReaderMembership = require("../models/ReaderMembership");
const Invoice = require("../models/Invoice");
const Refund = require("../models/Refund");
const BillingEvent = require("../models/BillingEvent");
const { activateCapturedPayment, cancelPaidMembership } = require("../services/premiumLifecycleService");
const { requestRefund, settleRefund } = require("../services/billingDomainService");
const { priceCatalog } = require("../billing/priceCatalog");
const { addCalendarMonths } = require("../premium/fixtures");
const entitlementService = require("../services/entitlementService");
const { requireEntitlement } = require("../middleware/entitlement");
const { resolveLearnAccess } = require("../learn/accessPolicy");
const { serializePublicContent } = require("../premium/contentPreview");
const { RazorpayBillingService } = require("../services/razorpayBillingService");
const { hmacHex } = require("../billing/providers/razorpay/signatures");
const membershipController = require("../controllers/membershipController");

jest.mock("../audit/AuditLogger", () => ({ log: jest.fn() }));
jest.setTimeout(30000);
const uri = process.env.PREMIUM_LIFECYCLE_MONGO_URI || "mongodb://127.0.0.1:27019/myjourney_premium_lifecycle_test?replicaSet=phase13test";
const models = [Payment, ReaderMembership, Invoice, Refund, BillingEvent];
const environment = { RAZORPAY_TEST_MODE: "true", RAZORPAY_KEY_ID: "rzp_test_phase13",
  RAZORPAY_KEY_SECRET: "isolated-test-secret", RAZORPAY_WEBHOOK_SECRET: "isolated-webhook-secret" };

describe("Phase 13 real Mongo membership lifecycle", () => {
  let userId;
  let client;
  let service;
  const ownedUsers = [];
  const createPayment = async ({ productCode = "PREMIUM_MONTHLY", status = "captured", ...extra } = {}) => {
    const price = priceCatalog.resolve({ productCode, market: "INDIA" });
    return Payment.create({ userId, productCode, market: price.market, currency: price.currency,
      amountMinor: price.amountMinor, provider: "razorpay", status,
      capturedAmountMinor: status === "captured" ? price.amountMinor : 0,
      capturedAt: status === "captured" ? new Date() : null,
      idempotencyKey: `phase13:${new mongoose.Types.ObjectId()}`, ...extra });
  };
  const readMembership = () => ReaderMembership.findOne({ userId }).lean();
  const providerEntity = (payment, status = "captured", id = `pay_${payment._id}`) => ({
    id, entity: "payment", order_id: payment.providerOrderId, amount: payment.amountMinor,
    currency: payment.currency, status, captured: status === "captured", fee: 900, tax: 100,
  });
  const deliver = async (eventId, eventType, payment, { createdAt = 1789718400, entity } = {}) => {
    const rawBody = Buffer.from(JSON.stringify({ event: eventType, created_at: createdAt,
      payload: { payment: { entity: entity || providerEntity(payment, eventType === "payment.failed" ? "failed" : "captured") } } }));
    return service.handleWebhook({ rawBody, providerEventId: eventId,
      signature: hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET) });
  };
  const confirm = async (payment) => {
    const entity = providerEntity(payment);
    client.fetchPayment.mockResolvedValue(entity);
    client.fetchOrder.mockResolvedValue({ id: payment.providerOrderId, status: "paid",
      amount: payment.amountMinor, amount_paid: payment.amountMinor, currency: payment.currency });
    return service.verifyCheckoutPayment({ userId, internalPaymentId: payment._id,
      razorpayOrderId: payment.providerOrderId, razorpayPaymentId: entity.id,
      razorpaySignature: hmacHex(`${payment.providerOrderId}|${entity.id}`, environment.RAZORPAY_KEY_SECRET) });
  };
  const refund = async (payment, amountMinor = payment.amountMinor) => {
    const reserved = await requestRefund({ userId, paymentId: payment._id, amountMinor,
      currency: payment.currency, reason: "Isolated Phase 13 refund test",
      idempotencyKey: `refund:${new mongoose.Types.ObjectId()}` });
    return settleRefund({ refundId: reserved._id, providerRefundId: `rfnd_${reserved._id}` });
  };

  beforeAll(async () => {
    const parsed = new URL(uri);
    if (!["127.0.0.1", "localhost"].includes(parsed.hostname) || !parsed.pathname.endsWith("_test")) {
      throw new Error("Premium integration requires a local database ending in _test.");
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName) throw new Error("Premium lifecycle integration requires a real Mongo replica set.");
    await Promise.all(models.map((model) => model.init()));
  });
  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    ownedUsers.push(userId);
    client = { fetchPayment: jest.fn(), fetchOrder: jest.fn() };
    service = new RazorpayBillingService({ environment, client });
  });
  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await Promise.all(models.map((model) => model.deleteMany({ userId: { $in: ownedUsers } })));
    }
    await mongoose.disconnect();
  });

  test("capture activates one canonical membership, invoice and entitlement audit", async () => {
    const payment = await createPayment({ status: "pending", providerOrderId: `order_${userId}` });
    await confirm(payment);
    const membership = await readMembership();
    const applied = await Payment.findById(payment._id).lean();
    expect(membership.paidPeriods).toHaveLength(1);
    expect((await entitlementService.resolveForUser(userId)).active).toBe(true);
    expect(String(applied.subscriptionId)).toBe(String(membership._id));
    const invoice = await Invoice.findOne({ paymentId: payment._id }).lean();
    expect(String(invoice.subscriptionId)).toBe(String(membership._id));
    expect(invoice).toMatchObject({ grossAmountMinor: 39900, currency: "INR" });
    expect(await BillingEvent.countDocuments({ userId, eventType: "premium.activated" })).toBe(1);
  });

  test("eight concurrent activations of one payment extend only once", async () => {
    const payment = await createPayment();
    await Promise.all(Array.from({ length: 8 }, () => activateCapturedPayment(payment._id)));
    const membership = await readMembership();
    expect(membership.paidPeriods).toHaveLength(1);
    expect(await BillingEvent.countDocuments({ userId, eventType: "premium.activated" })).toBe(1);
    expect(await Invoice.countDocuments({ userId })).toBe(1);
  });

  test("different concurrent purchases serialize into non-overlapping paid terms", async () => {
    const payments = await Promise.all([createPayment(), createPayment({ productCode: "PREMIUM_3_MONTH" })]);
    const now = new Date();
    await Promise.all(payments.map((payment) => activateCapturedPayment(payment._id, now)));
    const membership = await readMembership();
    expect(membership.paidPeriods).toHaveLength(2);
    expect(membership.paidPeriods[1].start).toEqual(membership.paidPeriods[0].end);
    expect(membership.currentPeriodEnd).toEqual(addCalendarMonths(addCalendarMonths(now, 1), 3));
  });

  test("an earlier activation request committing later cannot lower the successful-payment ordering boundary", async () => {
    const earlierRequestAt = new Date(Date.now() - 1000);
    const latestSuccessAt = new Date();
    await activateCapturedPayment((await createPayment())._id, latestSuccessAt);
    await activateCapturedPayment((await createPayment())._id, earlierRequestAt);
    expect((await readMembership()).latestSuccessfulPaymentAt).toEqual(latestSuccessAt);
    const delayedFailure = await createPayment({ status: "pending", providerOrderId: `order_${userId}`,
      createdAt: new Date(latestSuccessAt.getTime() - 500) });
    await deliver(`evt_delayed_${userId}`, "payment.failed", delayedFailure);
    expect((await readMembership()).lastPaymentIssue).toBeNull();
  });

  test("webhook plus concurrent callback/order.paid/replays cannot duplicate fulfillment", async () => {
    const payment = await createPayment({ status: "pending", providerOrderId: `order_${userId}` });
    await Promise.all([confirm(payment), deliver(`evt_${userId}`, "payment.captured", payment)]);
    await deliver(`evt_${userId}`, "payment.captured", payment);
    await deliver(`evt_order_${userId}`, "order.paid", payment);
    await confirm(payment);
    expect((await readMembership()).paidPeriods).toHaveLength(1);
    expect(await BillingEvent.countDocuments({ userId, eventType: "premium.activated" })).toBe(1);
  });

  test("renewal while active stacks remaining time; expired renewal starts at verification", async () => {
    const first = await createPayment();
    await activateCapturedPayment(first._id);
    const before = await readMembership();
    const second = await createPayment({ productCode: "PREMIUM_3_MONTH" });
    await activateCapturedPayment(second._id);
    expect((await Payment.findById(second._id)).entitlementStart).toEqual(before.currentPeriodEnd);
    const later = addCalendarMonths((await readMembership()).currentPeriodEnd, 1);
    const third = await createPayment();
    await activateCapturedPayment(third._id, later);
    expect((await Payment.findById(third._id)).entitlementStart).toEqual(later);
    expect((await readMembership()).paidPeriods).toHaveLength(1);
  });

  test("cancellation remains paid, idempotent, and cannot be replayed by subscription webhooks", async () => {
    const payment = await createPayment();
    await activateCapturedPayment(payment._id);
    const before = await readMembership();
    await Promise.all([cancelPaidMembership(userId), cancelPaidMembership(userId)]);
    expect((await entitlementService.resolveForUser(userId)).active).toBe(true);
    expect((await readMembership()).currentPeriodEnd).toEqual(before.currentPeriodEnd);
    expect(await BillingEvent.countDocuments({ userId, eventType: "premium.cancel_scheduled" })).toBe(1);
    const newer = await createPayment();
    await activateCapturedPayment(newer._id);
    const rawBody = Buffer.from(JSON.stringify({ event: "subscription.cancelled", created_at: 1 }));
    expect((await service.handleWebhook({ rawBody, providerEventId: `evt_cancel_${userId}`,
      signature: hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET) })).processingStatus).toBe("ignored");
    expect((await readMembership()).cancelAtPeriodEnd).toBe(false);
  });

  test("future failed renewal retains paid access and never invents grace", async () => {
    const first = await createPayment();
    await activateCapturedPayment(first._id);
    const before = await readMembership();
    const failure = await createPayment({ status: "pending", providerOrderId: `order_${userId}` });
    await deliver(`evt_fail_${userId}`, "payment.failed", failure);
    const state = await entitlementService.resolveForUser(userId);
    expect(state.active).toBe(true);
    expect(state.paymentIssue?.status).toBe("failed");
    expect((await readMembership()).currentPeriodEnd).toEqual(before.currentPeriodEnd);
    expect((await readMembership()).graceUntil).toBeNull();
    expect((await entitlementService.resolveForUser(userId, before.currentPeriodEnd)).active).toBe(false);
  });

  test("failed payment grants nothing, later verified retry grants exactly once", async () => {
    const payment = await createPayment({ status: "pending", providerOrderId: `order_${userId}` });
    await deliver(`evt_fail_${userId}`, "payment.failed", payment, { entity: providerEntity(payment, "failed", `pay_failed_${userId}`) });
    expect((await entitlementService.resolveForUser(userId)).active).toBe(false);
    await confirm(payment);
    await confirm(payment);
    await deliver(`evt_success_${userId}`, "payment.captured", payment);
    expect((await readMembership()).paidPeriods).toHaveLength(1);
    expect((await Payment.findById(payment._id)).status).toBe("captured");
  });

  test("stale failed attempts cannot replace a newer success or issue state", async () => {
    const old = await createPayment({ status: "pending", providerOrderId: `order_old_${userId}` });
    const successful = await createPayment({ status: "pending", providerOrderId: `order_success_${userId}` });
    await confirm(successful);
    await deliver(`evt_old_fail_${userId}`, "payment.failed", old, { createdAt: 1 });
    await deliver(`evt_success_fail_${userId}`, "payment.failed", successful, { createdAt: 1 });
    expect((await readMembership()).lastPaymentIssue).toBeNull();
    expect((await Payment.findById(successful._id)).status).toBe("captured");
    expect((await readMembership()).paidPeriods).toHaveLength(1);
  });

  test("partial refund retains access; final refund revokes exactly once", async () => {
    const payment = await createPayment({ providerPaymentId: `pay_${userId}` });
    await activateCapturedPayment(payment._id);
    await refund(payment, 10000);
    expect((await entitlementService.resolveForUser(userId)).active).toBe(true);
    const final = await refund(payment, 29900);
    await settleRefund({ refundId: final._id, providerRefundId: final.providerRefundId });
    expect((await entitlementService.resolveForUser(userId)).active).toBe(false);
    expect((await Payment.findById(payment._id)).refundedAmountMinor).toBe(39900);
    expect(await BillingEvent.countDocuments({ userId, eventType: "premium.revoked" })).toBe(1);
  });

  test("capture replay recovers missed activation after a partial refund without overwriting money", async () => {
    const payment = await createPayment({ providerOrderId: `order_${userId}` });
    payment.providerPaymentId = `pay_${payment._id}`;
    await payment.save();
    // Simulates a durable capture whose first entitlement transaction failed.
    await refund(payment, 10000);
    const invoiceBefore = await Invoice.findOne({ paymentId: payment._id }).lean();
    expect(invoiceBefore.refundAmountMinor).toBe(10000);
    await confirm(payment);
    await deliver(`evt_recover_${userId}`, "payment.captured", payment);
    const stored = await Payment.findById(payment._id).lean();
    const membership = await readMembership();
    const invoice = await Invoice.findOne({ paymentId: payment._id }).lean();
    expect(stored).toMatchObject({ status: "partially_refunded", refundedAmountMinor: 10000 });
    expect(membership.paidPeriods).toHaveLength(1);
    expect(invoice).toMatchObject({ status: "partially_refunded", refundAmountMinor: 10000 });
    expect(String(invoice.subscriptionId)).toBe(String(membership._id));
  });

  test("real signed refund events and replayed/stale deliveries settle/revoke only once", async () => {
    const payment = await createPayment({ providerPaymentId: `pay_${userId}` });
    await activateCapturedPayment(payment._id);
    const reserved = await requestRefund({ userId, paymentId: payment._id, amountMinor: payment.amountMinor,
      currency: payment.currency, reason: "Isolated webhook refund", idempotencyKey: `refund:${userId}` });
    const entity = { id: `rfnd_${reserved._id}`, payment_id: payment.providerPaymentId,
      receipt: reserved.refundReference, amount: payment.amountMinor, currency: payment.currency, status: "processed" };
    const deliverRefund = async (eventId, eventType) => {
      const rawBody = Buffer.from(JSON.stringify({ event: eventType, created_at: 1789718400,
        payload: { refund: { entity: { ...entity, status: eventType === "refund.failed" ? "failed" : "processed" } } } }));
      return service.handleWebhook({ rawBody, providerEventId: eventId,
        signature: hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET) });
    };
    await deliverRefund(`evt_refund_${userId}`, "refund.processed");
    await deliverRefund(`evt_refund_${userId}`, "refund.processed");
    await deliverRefund(`evt_refund_repeat_${userId}`, "refund.processed");
    expect((await deliverRefund(`evt_refund_stale_${userId}`, "refund.failed")).processingStatus).toBe("ignored");
    expect((await entitlementService.resolveForUser(userId)).active).toBe(false);
    expect((await Payment.findById(payment._id)).refundedAmountMinor).toBe(payment.amountMinor);
    expect(await BillingEvent.countDocuments({ userId, eventType: "premium.revoked" })).toBe(1);
  });

  test("overlapping attributed purchases retain independently current access after full refund", async () => {
    const first = await createPayment({ providerPaymentId: `pay_old_${userId}` });
    const second = await createPayment({ providerPaymentId: `pay_new_${userId}` });
    const now = new Date();
    await activateCapturedPayment(first._id, now);
    await activateCapturedPayment(second._id, now);
    await ReaderMembership.updateOne({ userId }, { $set: { "paidPeriods.1.start": now } });
    await refund(first);
    expect((await entitlementService.resolveForUser(userId)).active).toBe(true);
    expect((await readMembership()).paidPeriods.map((period) => String(period.paymentId))).toEqual([String(second._id)]);
  });

  test("failed renewal issue clears on verified recovery; stale failure then cannot replace success", async () => {
    await activateCapturedPayment((await createPayment())._id);
    const payment = await createPayment({ status: "pending", providerOrderId: `order_${userId}` });
    await deliver(`evt_failure_${userId}`, "payment.failed", payment);
    expect((await readMembership()).lastPaymentIssue.status).toBe("failed");
    await confirm(payment);
    await deliver(`evt_stale_failure_${userId}`, "payment.failed", payment, { createdAt: 1 });
    expect((await readMembership()).lastPaymentIssue).toBeNull();
    expect((await readMembership()).paidPeriods).toHaveLength(2);
  });

  test("refund of older stacked term does not revoke a newer independently valid term", async () => {
    const first = await createPayment({ providerPaymentId: `pay_old_${userId}` });
    const oldStart = addCalendarMonths(new Date(), -1);
    await activateCapturedPayment(first._id, oldStart);
    const second = await createPayment({ providerPaymentId: `pay_new_${userId}` });
    await activateCapturedPayment(second._id);
    const before = await readMembership();
    await refund(first);
    const after = await readMembership();
    expect(after.currentPeriodEnd).toEqual(before.currentPeriodEnd);
    expect((await entitlementService.resolveForUser(userId)).active).toBe(true);
    expect(after.paidPeriods.map((period) => String(period.paymentId))).toEqual([String(second._id)]);
  });

  test("refund of current term leaves future term scheduled, without leaking content in gap", async () => {
    const first = await createPayment({ providerPaymentId: `pay_old_${userId}` });
    await activateCapturedPayment(first._id);
    const second = await createPayment({ providerPaymentId: `pay_new_${userId}` });
    await activateCapturedPayment(second._id);
    const future = (await Payment.findById(second._id)).entitlementStart;
    await refund(first);
    expect((await entitlementService.resolveForUser(userId)).active).toBe(false);
    expect((await entitlementService.resolveForUser(userId, future)).active).toBe(true);
  });

  test("capture/refund races cannot resurrect revoked access or lose refund accounting", async () => {
    const payment = await createPayment({ providerPaymentId: `pay_${userId}` });
    const outcomes = await Promise.allSettled([activateCapturedPayment(payment._id), refund(payment)]);
    expect(outcomes[1].status).toBe("fulfilled");
    if (outcomes[0].status === "rejected") expect(outcomes[0].reason.code).toBe("PAYMENT_NOT_CAPTURED");
    expect((await entitlementService.resolveForUser(userId)).active).toBe(false);
    expect((await Payment.findById(payment._id)).status).toBe("refunded");
  });

  test("expired canonical access denies API content/learn/body regardless of User flags", async () => {
    const payment = await createPayment();
    await activateCapturedPayment(payment._id);
    const membership = await readMembership();
    const atEnd = await entitlementService.resolveForUser(userId, membership.currentPeriodEnd);
    expect(atEnd).toMatchObject({ active: false, subscriptionStatus: "expired" });
    await ReaderMembership.updateOne({ userId }, { $set: { "paidPeriods.0.end": new Date(Date.now() - 1) } });
    const app = express();
    app.use((req, _res, next) => { req.user = { _id: userId, isPremium: true }; next(); });
    app.get("/protected", requireEntitlement("premium_content"), (_req, res) => res.json({ private: true }));
    app.get("/membership", membershipController.getMyMembership);
    expect((await request(app).get("/protected")).status).toBe(403);
    expect((await resolveLearnAccess({ userId, accessLevel: "premium" })).allowed).toBe(false);
    const account = await request(app).get("/membership");
    expect(account.headers["cache-control"]).toBe("private, no-store");
    expect(account.body.data.active).toBe(false);
    expect(JSON.stringify(account.body)).not.toMatch(/providerPaymentId|providerSubscriptionId|paidPeriods|latestPaymentId|payloadSummary/);
    const content = serializePublicContent({ accessLevel: "premium", body: "PRIVATE", storySections: [{ body: "PRIVATE" }] },
      { canAccessPremium: account.body.data.entitlements.premium_content });
    expect(JSON.stringify(content)).not.toContain("PRIVATE");
  });
});
