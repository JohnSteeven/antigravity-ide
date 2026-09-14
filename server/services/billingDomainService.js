const crypto = require("crypto");
const mongoose = require("mongoose");
const BillingEvent = require("../models/BillingEvent");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const { Money } = require("../billing/money");
const { PAYMENT_TRANSITIONS, canTransition } = require("../billing/constants");
const { resolveCheckoutSelection } = require("../billing/priceCatalog");
const { sanitizeBillingMetadata } = require("../billing/safeMetadata");

const billingError = (message, code, status = 409) => Object.assign(new Error(message), { code, status });
const isDuplicateKey = (error) => error?.code === 11000 || error?.name === "MongoServerError" && error?.code === 11000;
const sameId = (left, right) => String(left || "") === String(right || "");

const ensureInvoiceForCapturedPayment = async (payment, { session } = {}) => {
  if (!payment || !["captured", "partially_refunded", "refunded"].includes(payment.status)) {
    throw billingError("Only a captured Payment can produce an invoice record.", "PAYMENT_NOT_CAPTURED");
  }
  const componentsKnown = [
    payment.indirectTaxMinor,
    payment.processorFeeMinor,
    payment.processorFeeTaxMinor,
    payment.fxAndCrossBorderCostMinor,
    payment.appStoreCommissionMinor,
  ].every(Number.isSafeInteger);
  const netAmountMinor = componentsKnown
    ? Math.max(0, payment.capturedAmountMinor
      - payment.indirectTaxMinor
      - payment.processorFeeMinor
      - payment.processorFeeTaxMinor
      - payment.refundedAmountMinor
      - payment.chargebackAmountMinor
      - payment.fxAndCrossBorderCostMinor
      - payment.appStoreCommissionMinor)
    : null;
  return Invoice.findOneAndUpdate(
    { paymentId: payment._id },
    {
      $setOnInsert: {
        invoiceNumber: `MJI-${crypto.randomUUID()}`,
        userId: payment.userId,
        paymentId: payment._id,
        subscriptionId: payment.subscriptionId || null,
        productCode: payment.productCode,
        provider: payment.provider,
        currency: payment.currency,
        grossAmountMinor: payment.capturedAmountMinor,
        indirectTaxMinor: payment.indirectTaxMinor,
        taxTreatment: payment.market === "INDIA" ? "gst_inclusive" : "taxes_as_applicable",
        issuedAt: payment.capturedAt || new Date(),
      },
      $set: {
        processorFeeMinor: payment.processorFeeMinor,
        processorFeeTaxMinor: payment.processorFeeTaxMinor,
        refundAmountMinor: payment.refundedAmountMinor,
        chargebackAmountMinor: payment.chargebackAmountMinor,
        fxAndCrossBorderCostMinor: payment.fxAndCrossBorderCostMinor,
        appStoreCommissionMinor: payment.appStoreCommissionMinor,
        netAmountMinor,
        status: payment.status === "refunded" ? "refunded" : payment.status === "partially_refunded" ? "partially_refunded" : "paid",
        paidAt: payment.capturedAt || new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true, session }
  );
};

const validateIdempotencyKey = (value) => {
  const key = String(value || "").trim();
  if (!/^[A-Za-z0-9:_-]{8,128}$/.test(key)) {
    throw billingError("A valid idempotency key is required.", "INVALID_IDEMPOTENCY_KEY", 422);
  }
  return key;
};

const assertPaymentIdempotencyMatch = (payment, price) => {
  if (payment.productCode !== price.productCode
    || payment.market !== price.market
    || payment.currency !== price.currency
    || payment.amountMinor !== price.amountMinor) {
    throw billingError("The idempotency key was already used for different payment terms.", "IDEMPOTENCY_CONFLICT");
  }
};

const createPaymentAttempt = async ({ user, clientSelection, idempotencyKey, provider = "razorpay", metadata = {} }) => {
  const userId = user?._id || user?.id;
  if (!userId) throw billingError("Authentication is required.", "AUTHENTICATION_REQUIRED", 401);
  const key = validateIdempotencyKey(idempotencyKey);
  const price = resolveCheckoutSelection({ user, clientSelection });
  let payment;
  try {
    payment = await Payment.findOneAndUpdate(
      { userId, idempotencyKey: key },
      {
        $setOnInsert: {
          userId,
          idempotencyKey: key,
          paymentReference: `pay_${crypto.randomUUID()}`,
          productCode: price.productCode,
          market: price.market,
          amountMinor: price.amountMinor,
          currency: price.currency,
          provider,
          status: "created",
          metadata: sanitizeBillingMetadata(metadata),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    payment = await Payment.findOne({ userId, idempotencyKey: key });
  }
  if (!payment) throw billingError("Payment attempt could not be created safely.", "PAYMENT_CREATE_CONFLICT");
  assertPaymentIdempotencyMatch(payment, price);
  return payment;
};

const allowedPredecessors = (nextStatus) => Object.keys(PAYMENT_TRANSITIONS)
  .filter((current) => canTransition(PAYMENT_TRANSITIONS, current, nextStatus));

const transitionPayment = async ({ paymentId, nextStatus, occurredAt = new Date(), providerPaymentId, updates = {}, session }) => {
  if (!PAYMENT_TRANSITIONS[nextStatus]) throw billingError("Unknown payment status.", "INVALID_PAYMENT_STATUS", 422);
  const timestampFields = nextStatus === "captured"
    ? { capturedAt: occurredAt }
    : nextStatus === "authorized"
      ? { authorizedAt: occurredAt }
      : nextStatus === "failed"
        ? { failedAt: occurredAt }
        : {};
  const allowedUpdates = [
    "capturedAmountMinor", "indirectTaxMinor", "processorFeeMinor", "processorFeeTaxMinor",
    "fxAndCrossBorderCostMinor", "appStoreCommissionMinor",
  ].reduce((safe, key) => {
    if (updates[key] !== undefined) safe[key] = updates[key];
    return safe;
  }, {});
  const set = { status: nextStatus, ...timestampFields, ...allowedUpdates };
  if (providerPaymentId) set.providerPaymentId = providerPaymentId;
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: { $in: allowedPredecessors(nextStatus) } },
    { $set: set },
    { new: true, runValidators: true, session }
  );
  if (payment) return payment;
  const existing = await Payment.findById(paymentId).session(session || null);
  if (!existing) throw billingError("Payment was not found.", "PAYMENT_NOT_FOUND", 404);
  if (existing.status === nextStatus) return existing;
  throw billingError(`Payment cannot move from ${existing.status} to ${nextStatus}.`, "INVALID_PAYMENT_TRANSITION");
};

const remainingRefundableMinor = (payment) => Math.max(
  0,
  Number(payment.capturedAmountMinor || 0)
    - Number(payment.refundedAmountMinor || 0)
    - Number(payment.refundReservedMinor || 0)
);

const assertRefundMatches = (refund, { paymentId, amountMinor, currency }) => {
  if (!sameId(refund.paymentId, paymentId) || refund.amountMinor !== amountMinor || refund.currency !== currency) {
    throw billingError("The idempotency key was already used for a different refund.", "IDEMPOTENCY_CONFLICT");
  }
};

const requestRefund = async ({ userId, paymentId, amountMinor, currency, idempotencyKey, reason, metadata = {} }) => {
  const key = validateIdempotencyKey(idempotencyKey);
  const money = new Money(amountMinor, currency);
  if (money.isZero()) throw billingError("Refund amount must be greater than zero.", "INVALID_REFUND_AMOUNT", 422);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const existing = await Refund.findOne({ userId, idempotencyKey: key }).session(session);
      if (existing) {
        assertRefundMatches(existing, { paymentId, amountMinor, currency: money.currency });
        result = existing;
        return;
      }
      const payment = await Payment.findOne({ _id: paymentId, userId }).session(session);
      if (!payment) throw billingError("Payment was not found.", "PAYMENT_NOT_FOUND", 404);
      if (!["captured", "partially_refunded"].includes(payment.status)) throw billingError("Only captured payments can be refunded.", "PAYMENT_NOT_REFUNDABLE");
      if (payment.currency !== money.currency) throw billingError("Refund currency must match the payment currency.", "CURRENCY_MISMATCH", 422);
      if (money.amountMinor > remainingRefundableMinor(payment)) throw billingError("Refund exceeds the remaining captured amount.", "REFUND_EXCEEDS_CAPTURED_AMOUNT", 422);

      const reserved = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          userId,
          $expr: {
            $lte: [
              { $add: [{ $ifNull: ["$refundedAmountMinor", 0] }, { $ifNull: ["$refundReservedMinor", 0] }, money.amountMinor] },
              { $ifNull: ["$capturedAmountMinor", 0] },
            ],
          },
        },
        { $inc: { refundReservedMinor: money.amountMinor } },
        { new: true, runValidators: true, session }
      );
      if (!reserved) throw billingError("Refund exceeds the remaining captured amount.", "REFUND_EXCEEDS_CAPTURED_AMOUNT", 422);
      [result] = await Refund.create([{
        userId,
        paymentId,
        provider: payment.provider,
        idempotencyKey: key,
        amountMinor: money.amountMinor,
        currency: money.currency,
        reason: String(reason || "").trim(),
        status: "requested",
        metadata: sanitizeBillingMetadata(metadata),
      }], { session });
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    result = await Refund.findOne({ userId, idempotencyKey: key });
    if (!result) throw error;
    assertRefundMatches(result, { paymentId, amountMinor, currency: money.currency });
  } finally {
    await session.endSession();
  }
  return result;
};

const settleRefund = async ({ refundId, providerRefundId, providerEventId, processedAt = new Date() }) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const refund = await Refund.findById(refundId).session(session);
      if (!refund) throw billingError("Refund was not found.", "REFUND_NOT_FOUND", 404);
      if (refund.status === "processed") { result = refund; return; }
      if (!["requested", "pending"].includes(refund.status)) throw billingError("Refund cannot be settled from its current state.", "INVALID_REFUND_TRANSITION");
      const payment = await Payment.findById(refund.paymentId).session(session);
      if (!payment || payment.refundReservedMinor < refund.amountMinor) throw billingError("Refund reservation is inconsistent.", "REFUND_RESERVATION_CONFLICT");
      const refundedAmountMinor = payment.refundedAmountMinor + refund.amountMinor;
      const paymentStatus = refundedAmountMinor === payment.capturedAmountMinor ? "refunded" : "partially_refunded";
      const paymentUpdate = await Payment.updateOne(
        { _id: payment._id, refundReservedMinor: { $gte: refund.amountMinor } },
        { $inc: { refundReservedMinor: -refund.amountMinor, refundedAmountMinor: refund.amountMinor }, $set: { status: paymentStatus } },
        { runValidators: true, session }
      );
      if (paymentUpdate.matchedCount !== undefined && paymentUpdate.matchedCount !== 1) {
        throw billingError("Refund reservation is inconsistent.", "REFUND_RESERVATION_CONFLICT");
      }
      await Invoice.updateOne(
        { paymentId: payment._id },
        { $inc: { refundAmountMinor: refund.amountMinor }, $set: { status: paymentStatus === "refunded" ? "refunded" : "partially_refunded", netAmountMinor: null } },
        { runValidators: true, session }
      );
      result = await Refund.findOneAndUpdate(
        { _id: refund._id, status: { $in: ["requested", "pending"] } },
        { $set: { status: "processed", providerRefundId, providerEventId: providerEventId || null, processedAt } },
        { new: true, runValidators: true, session }
      );
      if (!result) throw billingError("Refund was concurrently changed.", "REFUND_SETTLEMENT_CONFLICT");
    });
  } finally {
    await session.endSession();
  }
  return result;
};

const markRefundPending = async ({ refundId, providerRefundId }) => {
  const refund = await Refund.findOneAndUpdate(
    { _id: refundId, status: { $in: ["requested", "pending"] } },
    { $set: { status: "pending", providerRefundId } },
    { new: true, runValidators: true }
  );
  if (refund) return refund;
  const existing = await Refund.findById(refundId);
  if (existing?.status === "processed") return existing;
  throw billingError("Refund cannot move to pending from its current state.", "INVALID_REFUND_TRANSITION");
};

const failRefund = async ({ refundId, providerRefundId, providerEventId, failedAt = new Date(), errorCode }) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const refund = await Refund.findById(refundId).session(session);
      if (!refund) throw billingError("Refund was not found.", "REFUND_NOT_FOUND", 404);
      if (refund.status === "failed") { result = refund; return; }
      if (!["requested", "pending"].includes(refund.status)) throw billingError("Refund cannot be failed from its current state.", "INVALID_REFUND_TRANSITION");
      const paymentUpdate = await Payment.updateOne(
        { _id: refund.paymentId, refundReservedMinor: { $gte: refund.amountMinor } },
        { $inc: { refundReservedMinor: -refund.amountMinor } },
        { runValidators: true, session }
      );
      if (paymentUpdate.matchedCount !== undefined && paymentUpdate.matchedCount !== 1) {
        throw billingError("Refund reservation is inconsistent.", "REFUND_RESERVATION_CONFLICT");
      }
      result = await Refund.findOneAndUpdate(
        { _id: refund._id, status: { $in: ["requested", "pending"] } },
        { $set: { status: "failed", providerRefundId: providerRefundId || refund.providerRefundId, providerEventId: providerEventId || null, failedAt, "metadata.providerErrorCode": errorCode || null } },
        { new: true, runValidators: true, session }
      );
      if (!result) throw billingError("Refund was concurrently changed.", "REFUND_SETTLEMENT_CONFLICT");
    });
  } finally {
    await session.endSession();
  }
  return result;
};

const claimBillingEvent = async ({
  provider,
  providerEventId,
  eventType,
  occurredAt,
  payloadHash,
  payloadSummary = {},
  leaseMs = 5 * 60 * 1000,
  now = new Date(),
}) => {
  const processingClaimToken = crypto.randomUUID();
  const event = {
    provider,
    providerEventId,
    eventType,
    occurredAt: occurredAt || null,
    receivedAt: now,
    processingStartedAt: now,
    processingLeaseUntil: new Date(now.getTime() + leaseMs),
    processingClaimToken,
    processingStatus: "processing",
    payloadHash: payloadHash || null,
    payloadSummary: sanitizeBillingMetadata(payloadSummary),
  };
  try {
    return { claimed: true, event: await BillingEvent.create(event), claimToken: processingClaimToken };
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }

  const reclaimed = await BillingEvent.findOneAndUpdate(
    {
      provider,
      providerEventId,
      payloadHash: payloadHash || null,
      $or: [
        { processingStatus: "failed" },
        { processingStatus: "processing", processingLeaseUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        processingStatus: "processing",
        processingStartedAt: now,
        processingLeaseUntil: new Date(now.getTime() + leaseMs),
        processingClaimToken,
        errorCode: null,
        errorSummary: null,
      },
      $inc: { processingAttempts: 1 },
    },
    { new: true }
  ).select("+processingClaimToken");
  if (reclaimed) return { claimed: true, event: reclaimed, claimToken: processingClaimToken };
  const existing = await BillingEvent.findOne({ provider, providerEventId });
  if (existing?.payloadHash && payloadHash && existing.payloadHash !== payloadHash) {
    throw billingError("A provider event ID was replayed with different content.", "PROVIDER_EVENT_PAYLOAD_MISMATCH", 409);
  }
  return { claimed: false, event: existing, claimToken: null };
};

const completeBillingEvent = async ({ eventId, claimToken, processingStatus = "processed", updates = {} }) => {
  if (!["processed", "ignored"].includes(processingStatus)) throw billingError("Invalid event completion status.", "INVALID_EVENT_STATUS", 422);
  const allowedUpdates = [
    "aggregateType", "aggregateId", "userId", "previousStatus", "newStatus",
    "amountMinor", "currency", "subscriptionId", "paymentId", "refundId",
  ].reduce((safe, key) => {
    if (updates[key] !== undefined) safe[key] = updates[key];
    return safe;
  }, {});
  const event = await BillingEvent.findOneAndUpdate(
    { _id: eventId, processingStatus: "processing", processingClaimToken: claimToken },
    {
      $set: {
        ...allowedUpdates,
        processingStatus,
        processedAt: new Date(),
        processingLeaseUntil: null,
        processingClaimToken: null,
      },
    },
    { new: true }
  );
  if (!event) throw billingError("Billing event claim is no longer valid.", "BILLING_EVENT_CLAIM_LOST");
  return event;
};

const failBillingEvent = async ({ eventId, claimToken, error }) => {
  const event = await BillingEvent.findOneAndUpdate(
    { _id: eventId, processingStatus: "processing", processingClaimToken: claimToken },
    {
      $set: {
        processingStatus: "failed",
        processedAt: new Date(),
        processingLeaseUntil: null,
        processingClaimToken: null,
        errorCode: String(error?.code || "BILLING_EVENT_PROCESSING_FAILED").slice(0, 80),
        errorSummary: String(error?.message || "Billing event processing failed.").slice(0, 1000),
      },
    },
    { new: true }
  );
  if (!event) throw billingError("Billing event failure could not be recorded under the active claim.", "BILLING_EVENT_CLAIM_LOST");
  return event;
};

module.exports = {
  assertPaymentIdempotencyMatch,
  claimBillingEvent,
  completeBillingEvent,
  createPaymentAttempt,
  ensureInvoiceForCapturedPayment,
  failRefund,
  failBillingEvent,
  markRefundPending,
  remainingRefundableMinor,
  requestRefund,
  settleRefund,
  transitionPayment,
  validateIdempotencyKey,
};
