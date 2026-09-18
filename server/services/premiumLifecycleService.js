const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const ReaderMembership = require("../models/ReaderMembership");
const BillingEvent = require("../models/BillingEvent");
const { priceCatalog } = require("../billing/priceCatalog");
const { addCalendarMonths } = require("../premium/fixtures");
const { periodBounds, retainedPeriods } = require("../premium/entitlementWindows");
const { evaluatePremiumAccess } = require("./subscriptionService");

const error = (message, code) => Object.assign(new Error(message), { code, status: 409 });

const recordLifecycleEvent = async ({ eventId, eventType, payment, membership, occurredAt, session }) => {
  await BillingEvent.findOneAndUpdate(
    { provider: "myjourney", providerEventId: eventId },
    { $setOnInsert: {
      provider: "myjourney", providerEventId: eventId, eventType,
      aggregateType: "subscription", aggregateId: membership._id,
      userId: membership.userId, subscriptionId: membership._id,
      paymentId: payment?._id || null,
      amountMinor: payment?.amountMinor ?? null, currency: payment?.currency || null,
      occurredAt, receivedAt: occurredAt, processedAt: occurredAt,
      processingStatus: "processed", processingLeaseUntil: null,
      newStatus: membership.billingStatus,
      payloadSummary: { start: membership.currentPeriodStart, end: membership.currentPeriodEnd },
    } },
    { upsert: true, new: true, runValidators: true, session }
  );
};

// Driver retries write conflicts. First-membership unique-index races also retry
// from a fresh snapshot; every side effect stays inside the same transaction.
const inTransaction = async (work) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => { result = await work(session); });
      return result;
    } catch (failure) {
      if (failure.code !== 11000 || attempt === 2) throw failure;
    } finally { await session.endSession(); }
  }
};

const existingPeriods = (membership, now) => {
  if (Array.isArray(membership?.paidPeriods)) return retainedPeriods(membership.paidPeriods, now);
  if (!evaluatePremiumAccess(membership, now).active) return [];
  const end = ["trialing"].includes(membership.billingStatus)
    ? membership.trialEnd || membership.currentPeriodEnd
    : ["past_due", "grace_period"].includes(membership.billingStatus)
      ? new Date(Math.max(new Date(membership.currentPeriodEnd || 0), new Date(membership.graceUntil || 0)))
      : membership.currentPeriodEnd;
  return [{ start: membership.currentPeriodStart || membership.startedAt || now, end,
    source: "legacy", paymentId: null, productCode: membership.productCode || null,
    billingPeriodMonths: membership.billingPeriodMonths }];
};

const activateCapturedPayment = async (paymentId, now = new Date()) => inTransaction(async (session) => {
  const payment = await Payment.findById(paymentId).session(session);
  if (!payment || !["captured", "partially_refunded"].includes(payment.status)
    || payment.capturedAmountMinor !== payment.amountMinor
    || payment.refundedAmountMinor >= payment.capturedAmountMinor) {
    throw error("A verified, non-refunded capture is required for Premium activation.", "PAYMENT_NOT_CAPTURED");
  }
  if (payment.entitlementAppliedAt) return payment;
  const price = priceCatalog.resolve({ productCode: payment.productCode, market: payment.market });
  if (price.amountMinor !== payment.amountMinor || price.currency !== payment.currency
    || price.provider !== payment.provider) {
    throw error("Stored Payment does not match the authoritative Premium catalog.", "PAYMENT_CATALOG_MISMATCH");
  }
  const previous = await ReaderMembership.findOne({ userId: payment.userId }).session(session);
  if (previous?.providerSubscriptionId) {
    throw error("Recurring provider membership requires reconciliation before prepaid activation.", "SUBSCRIPTION_RECONCILIATION_REQUIRED");
  }
  const periods = existingPeriods(previous, now);
  const bounds = periodBounds(periods);
  const start = bounds.currentPeriodEnd && bounds.currentPeriodEnd > now ? bounds.currentPeriodEnd : now;
  const end = addCalendarMonths(start, price.durationMonths);
  periods.push({ paymentId: payment._id, source: "payment", start, end,
    productCode: payment.productCode, billingPeriodMonths: price.durationMonths });
  const membership = await ReaderMembership.findOneAndUpdate(
    { userId: payment.userId },
    { $set: {
      plan: "premium", provider: payment.provider, productCode: payment.productCode,
      market: payment.market, currency: payment.currency, amountMinor: payment.amountMinor,
      billingPeriodMonths: price.durationMonths, paidPeriods: periods,
      ...periodBounds(periods), startedAt: previous?.startedAt || start,
      latestPaymentId: payment._id,
      latestSuccessfulPaymentAt: previous?.latestSuccessfulPaymentAt > now ? previous.latestSuccessfulPaymentAt : now,
      billingStatus: "active", cancelAtPeriodEnd: false, canceledAt: null,
      graceUntil: null, trialStart: null, trialEnd: null, endedAt: null,
      lastPaymentIssue: null,
    }, $setOnInsert: { userId: payment.userId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, session }
  );
  const applied = await Payment.findOneAndUpdate(
    { _id: payment._id, entitlementAppliedAt: null, status: { $in: ["captured", "partially_refunded"] } },
    { $set: { subscriptionId: membership._id, entitlementAppliedAt: now,
      entitlementStart: start, entitlementEnd: end } },
    { new: true, runValidators: true, session }
  );
  if (!applied) throw error("Payment activation was concurrently changed.", "ENTITLEMENT_CONFLICT");
  await recordLifecycleEvent({ eventId: `premium:activate:${payment._id}`,
    eventType: "premium.activated", payment: applied, membership, occurredAt: now, session });
  // An invoice may already exist from a capture completed before a retry.
  const { ensureInvoiceForCapturedPayment } = require("./billingDomainService");
  await ensureInvoiceForCapturedPayment(applied, { session });
  return applied;
});

// Called inside refund settlement's transaction, after funds become refunded.
const revokeFullyRefundedPayment = async ({ payment, processedAt, session }) => {
  if (!payment.entitlementAppliedAt || payment.entitlementRevokedAt) return;
  const membership = await ReaderMembership.findOne({ userId: payment.userId }).session(session);
  if (!membership || !Array.isArray(membership.paidPeriods)) {
    throw error("Paid membership attribution is missing.", "ENTITLEMENT_RECONCILIATION_REQUIRED");
  }
  const periods = retainedPeriods(membership.paidPeriods, processedAt)
    .filter((period) => String(period.paymentId || "") !== String(payment._id));
  const updated = await ReaderMembership.findOneAndUpdate(
    { _id: membership._id },
    { $set: { paidPeriods: periods, ...periodBounds(periods),
      billingStatus: periods.length ? (membership.cancelAtPeriodEnd ? "cancel_pending" : "active") : "expired",
      endedAt: periods.length ? null : processedAt } },
    { new: true, runValidators: true, session }
  );
  await Payment.updateOne({ _id: payment._id, entitlementRevokedAt: null },
    { $set: { entitlementRevokedAt: processedAt } }, { session, runValidators: true });
  await recordLifecycleEvent({ eventId: `premium:revoke:${payment._id}`,
    eventType: "premium.revoked", payment, membership: updated, occurredAt: processedAt, session });
};

const noteFailedPayment = async (paymentId) => inTransaction(async (session) => {
  const payment = await Payment.findById(paymentId).session(session);
  if (!payment || payment.status !== "failed") return;
  // A failed older order/attempt cannot overwrite a later successful purchase.
  // Use the authoritative internal order creation time, not a guessed event order.
  await ReaderMembership.updateOne({ userId: payment.userId,
    $and: [
      { $or: [{ latestSuccessfulPaymentAt: null }, { latestSuccessfulPaymentAt: { $lt: payment.createdAt } }] },
      { $or: [{ "lastPaymentIssue.attemptCreatedAt": null },
        { "lastPaymentIssue.attemptCreatedAt": { $lte: payment.createdAt } }] },
    ],
  }, { $set: { lastPaymentIssue: { paymentId: payment._id,
    occurredAt: payment.failedAt, attemptCreatedAt: payment.createdAt, status: "failed" } } },
  { session, runValidators: true });
});

const cancelPaidMembership = async (userId, now = new Date()) => inTransaction(async (session) => {
  const membership = await ReaderMembership.findOne({ userId }).session(session);
  if (!membership) throw Object.assign(error("Premium membership was not found.", "SUBSCRIPTION_NOT_FOUND"), { status: 404 });
  if (!evaluatePremiumAccess(membership, now).active) throw error("Premium membership is not currently active.", "SUBSCRIPTION_NOT_ACTIVE");
  if (membership.providerSubscriptionId) throw error("Recurring provider cancellation is unavailable.", "BILLING_PROVIDER_UNAVAILABLE");
  if (membership.cancelAtPeriodEnd) return membership;
  const updated = await ReaderMembership.findOneAndUpdate({ _id: membership._id },
    { $set: { cancelAtPeriodEnd: true, canceledAt: now, billingStatus: "cancel_pending" } },
    { new: true, runValidators: true, session });
  await recordLifecycleEvent({ eventId: `premium:cancel:${membership._id}:${membership.latestPaymentId || "legacy"}:${now.getTime()}`,
    eventType: "premium.cancel_scheduled", membership: updated, occurredAt: now, session });
  return updated;
});

module.exports = { activateCapturedPayment, cancelPaidMembership, existingPeriods,
  inTransaction, noteFailedPayment, revokeFullyRefundedPayment };
