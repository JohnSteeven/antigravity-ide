const crypto = require("crypto");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const { activateCapturedPayment, noteFailedPayment } = require("./premiumLifecycleService");
const { RazorpayClient } = require("../billing/providers/razorpay/client");
const { assertRazorpayApiConfigured, assertRazorpayWebhookConfigured, readRazorpayConfig } = require("../billing/providers/razorpay/config");
const { verifyPaymentSignature, verifyWebhookSignature } = require("../billing/providers/razorpay/signatures");
const {
  claimBillingEvent,
  completeBillingEvent,
  createPaymentAttempt,
  failBillingEvent,
  failRefund,
  markRefundPending,
  settleRefund,
  transitionPayment,
} = require("./billingDomainService");

const serviceError = (message, code, status = 409) => Object.assign(new Error(message), { code, status });
const sameId = (left, right) => String(left || "") === String(right || "");
const asDateFromUnix = (value) => Number.isSafeInteger(value) && value > 0 ? new Date(value * 1000) : null;

const checkoutData = (payment, config) => ({
  provider: "razorpay",
  testMode: true,
  keyId: config.keyId,
  internalPaymentId: String(payment._id),
  orderId: payment.providerOrderId,
  productCode: payment.productCode,
  market: payment.market,
  amountMinor: payment.amountMinor,
  currency: payment.currency,
  name: "MyJourney Premium",
});

const safeRefundData = (refund) => ({
  id: String(refund._id),
  paymentId: String(refund.paymentId),
  amountMinor: refund.amountMinor,
  currency: refund.currency,
  status: refund.status,
  providerRefundId: refund.providerRefundId || null,
});

class RazorpayBillingService {
  constructor({ environment = process.env, client } = {}) {
    this.config = readRazorpayConfig(environment);
    this.client = client || new RazorpayClient({ config: this.config });
  }

  capability() {
    return {
      provider: "razorpay",
      testMode: true,
      providerConfigured: this.config.apiConfigured,
      checkoutAvailable: this.config.apiConfigured,
      refundAvailable: this.config.apiConfigured,
      portalAvailable: false,
      webhookAvailable: this.config.webhookConfigured,
      configurationError: this.config.configurationError,
    };
  }

  async createCheckoutSession({ user, productCode, idempotencyKey, metadata = {} }) {
    const config = assertRazorpayApiConfigured(this.config);
    const payment = await createPaymentAttempt({
      user,
      clientSelection: { productCode },
      idempotencyKey,
      provider: "razorpay",
      metadata,
    });
    if (payment.providerOrderId) return checkoutData(payment, config);

    const claimToken = crypto.randomUUID();
    const now = new Date();
    const claimed = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        providerOrderId: null,
        "orderCreation.state": { $in: ["ready", "failed"] },
      },
      {
        $set: {
          "orderCreation.state": "creating",
          "orderCreation.claimToken": claimToken,
          "orderCreation.leaseUntil": new Date(now.getTime() + this.config.timeoutMs + 5000),
          "orderCreation.lastErrorCode": null,
        },
        $inc: { "orderCreation.attempts": 1 },
      },
      { new: true }
    ).select("+orderCreation.claimToken +orderCreation.leaseUntil");

    if (!claimed) {
      const current = await Payment.findById(payment._id).select("+orderCreation.leaseUntil");
      if (current?.providerOrderId) return checkoutData(current, config);
      const staleCreating = current?.orderCreation?.state === "creating"
        && current.orderCreation.leaseUntil
        && current.orderCreation.leaseUntil <= now;
      if (staleCreating) {
        await Payment.updateOne(
          { _id: payment._id, providerOrderId: null, "orderCreation.state": "creating", "orderCreation.leaseUntil": { $lte: now } },
          { $set: { "orderCreation.state": "uncertain", "orderCreation.claimToken": null } }
        );
      }
      const code = current?.orderCreation?.state === "creating" && !staleCreating
        ? "CHECKOUT_CREATION_IN_PROGRESS"
        : "CHECKOUT_RECONCILIATION_REQUIRED";
      throw serviceError("Checkout order creation is already in progress or requires reconciliation.", code, 409);
    }

    try {
      const order = await this.client.createOrder({
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        receipt: payment.paymentReference,
        notes: { internal_payment_id: String(payment._id), product_code: payment.productCode },
      });
      if (!order?.id
        || order.entity !== "order"
        || order.amount !== payment.amountMinor
        || order.currency !== payment.currency
        || order.receipt !== payment.paymentReference) {
        throw serviceError("Razorpay returned order terms that do not match the authoritative Payment.", "PROVIDER_ORDER_MISMATCH", 502);
      }
      const stored = await Payment.findOneAndUpdate(
        { _id: payment._id, "orderCreation.state": "creating", "orderCreation.claimToken": claimToken, providerOrderId: null },
        {
          $set: {
            providerOrderId: order.id,
            status: "pending",
            "orderCreation.state": "created",
            "orderCreation.claimToken": null,
            "orderCreation.leaseUntil": null,
          },
        },
        { new: true, runValidators: true }
      );
      if (!stored) throw serviceError("Checkout claim was lost before the order could be recorded.", "CHECKOUT_CLAIM_LOST", 409);
      return checkoutData(stored, config);
    } catch (error) {
      // Once a provider call may have crossed the network, any local/unknown
      // failure is uncertain. Only an explicit non-retryable provider 4xx is a
      // safe failed attempt that may create another order later.
      const uncertain = error.providerStatus === undefined
        || Boolean(error.retryable || error.providerStatus >= 500);
      await Payment.updateOne(
        { _id: payment._id, "orderCreation.claimToken": claimToken },
        {
          $set: {
            "orderCreation.state": uncertain ? "uncertain" : "failed",
            "orderCreation.claimToken": null,
            "orderCreation.leaseUntil": null,
            "orderCreation.lastErrorCode": String(error.code || "RAZORPAY_ORDER_FAILED").slice(0, 80),
          },
        }
      );
      throw error;
    }
  }

  assertPaymentTerms(payment, entity) {
    if (!entity
      || typeof entity.id !== "string" || !entity.id.trim()
      || entity.order_id !== payment.providerOrderId
      || entity.amount !== payment.amountMinor
      || entity.currency !== payment.currency) {
      throw serviceError("Provider payment terms do not match the authoritative Payment.", "PROVIDER_PAYMENT_MISMATCH", 409);
    }
  }

  async verifyCheckoutPayment({ userId, internalPaymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const config = assertRazorpayApiConfigured(this.config);
    const payment = await Payment.findOne({ _id: internalPaymentId, userId });
    if (!payment) throw serviceError("Payment was not found.", "PAYMENT_NOT_FOUND", 404);
    if (!payment.providerOrderId || payment.providerOrderId !== razorpayOrderId) throw serviceError("Checkout order does not match this Payment.", "PAYMENT_ORDER_MISMATCH", 400);
    verifyPaymentSignature({
      orderId: payment.providerOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      keySecret: config.keySecret,
    });
    const [providerPayment, providerOrder] = await Promise.all([
      this.client.fetchPayment(razorpayPaymentId),
      this.client.fetchOrder(payment.providerOrderId),
    ]);
    this.assertPaymentTerms(payment, providerPayment);
    if (providerPayment.id !== razorpayPaymentId
      || providerPayment.status !== "captured"
      || providerPayment.captured !== true
      || providerOrder.id !== payment.providerOrderId
      || providerOrder.status !== "paid"
      || providerOrder.amount !== payment.amountMinor
      || providerOrder.currency !== payment.currency
      || providerOrder.amount_paid !== payment.amountMinor) {
      throw serviceError("Razorpay has not confirmed a fully captured payment.", "PAYMENT_NOT_CAPTURED", 409);
    }
    const fee = Number.isSafeInteger(providerPayment.fee) ? providerPayment.fee : null;
    const tax = Number.isSafeInteger(providerPayment.tax) ? providerPayment.tax : null;
    const captured = await transitionPayment({
      paymentId: payment._id,
      nextStatus: "captured",
      providerPaymentId: providerPayment.id,
      occurredAt: new Date(),
      updates: {
        capturedAmountMinor: providerPayment.amount,
        processorFeeMinor: fee === null || tax === null ? null : Math.max(0, fee - tax),
        processorFeeTaxMinor: tax,
      },
    });
    const activated = await activateCapturedPayment(captured._id);
    return activated;
  }

  async processPaymentEvent(payload, eventType) {
    const entity = payload?.payload?.payment?.entity;
    if (!entity?.order_id) throw serviceError("Razorpay payment event is missing an order mapping.", "PAYMENT_MAPPING_NOT_FOUND", 422);
    const payment = await Payment.findOne({ provider: "razorpay", providerOrderId: entity.order_id });
    if (!payment) throw serviceError("Razorpay order is not mapped to an internal Payment.", "PAYMENT_MAPPING_NOT_FOUND", 404);
    this.assertPaymentTerms(payment, entity);
    const nextStatus = eventType === "payment.authorized" ? "authorized"
      : eventType === "payment.failed" ? "failed"
        : "captured";
    const providerStateMatches = nextStatus === "captured"
      ? entity.status === "captured" && entity.captured === true
      : entity.status === nextStatus;
    if (!providerStateMatches) {
      throw serviceError("Razorpay event type and payment state do not match.", "PROVIDER_PAYMENT_STATE_MISMATCH", 409);
    }
    const fee = Number.isSafeInteger(entity.fee) ? entity.fee : null;
    const tax = Number.isSafeInteger(entity.tax) ? entity.tax : null;
    try {
      const transitioned = await transitionPayment({
        paymentId: payment._id,
        nextStatus,
        providerPaymentId: entity.id,
        occurredAt: asDateFromUnix(payload.created_at) || new Date(),
        updates: nextStatus === "captured" ? {
          capturedAmountMinor: entity.amount,
          processorFeeMinor: fee === null || tax === null ? null : Math.max(0, fee - tax),
          processorFeeTaxMinor: tax,
        } : {},
      });
      if (nextStatus === "captured") {
        await activateCapturedPayment(transitioned._id);
      }
      if (nextStatus === "failed") await noteFailedPayment(transitioned._id);
      return { processingStatus: "processed", payment: transitioned, previousStatus: payment.status, newStatus: transitioned.status };
    } catch (error) {
      if (error.code === "INVALID_PAYMENT_TRANSITION") {
        return { processingStatus: "ignored", payment, previousStatus: payment.status, newStatus: payment.status };
      }
      throw error;
    }
  }

  async findRefundForEntity(entity) {
    if (!entity?.id || !entity.payment_id) throw serviceError("Razorpay refund event is incomplete.", "REFUND_MAPPING_NOT_FOUND", 422);
    const clauses = [{ providerRefundId: entity.id }];
    if (entity.receipt) clauses.push({ refundReference: entity.receipt });
    const refund = await Refund.findOne({ provider: "razorpay", $or: clauses });
    if (!refund) throw serviceError("Razorpay refund is not mapped to an internal Refund.", "REFUND_MAPPING_NOT_FOUND", 404);
    const payment = await Payment.findById(refund.paymentId);
    if (!payment
      || payment.providerPaymentId !== entity.payment_id
      || refund.amountMinor !== entity.amount
      || refund.currency !== entity.currency) {
      throw serviceError("Provider refund terms do not match the internal Refund.", "PROVIDER_REFUND_MISMATCH", 409);
    }
    return { refund, payment };
  }

  async processRefundEvent(payload, eventType, providerEventId) {
    const entity = payload?.payload?.refund?.entity;
    const { refund } = await this.findRefundForEntity(entity);
    const previousStatus = refund.status;
    if (refund.status === "processed" && eventType !== "refund.processed") {
      return { processingStatus: "ignored", refund, previousStatus, newStatus: refund.status };
    }
    if (refund.status === "failed" && eventType !== "refund.failed") {
      return { processingStatus: "ignored", refund, previousStatus, newStatus: refund.status };
    }
    if (eventType === "refund.failed" || entity.status === "failed") {
      const failed = await failRefund({ refundId: refund._id, providerRefundId: entity.id, providerEventId, errorCode: "RAZORPAY_REFUND_FAILED" });
      return { processingStatus: "processed", refund: failed, previousStatus, newStatus: failed.status };
    }
    if (eventType === "refund.processed" || entity.status === "processed") {
      const processed = await settleRefund({ refundId: refund._id, providerRefundId: entity.id, providerEventId });
      return { processingStatus: "processed", refund: processed, previousStatus, newStatus: processed.status };
    }
    const pending = await markRefundPending({ refundId: refund._id, providerRefundId: entity.id });
    return { processingStatus: "processed", refund: pending, previousStatus, newStatus: pending.status };
  }

  async handleWebhook({ rawBody, signature, providerEventId }) {
    const config = assertRazorpayWebhookConfigured(this.config);
    verifyWebhookSignature({ rawBody, signature, webhookSecrets: config.webhookSecrets });
    const eventId = String(providerEventId || "").trim();
    if (!eventId || eventId.length > 160) throw serviceError("Razorpay event ID is required.", "INVALID_PROVIDER_EVENT_ID", 400);
    let payload;
    try { payload = JSON.parse(rawBody.toString("utf8")); }
    catch (_error) { throw serviceError("Razorpay webhook body is not valid JSON.", "INVALID_WEBHOOK_BODY", 400); }
    const eventType = String(payload?.event || "").trim();
    if (!eventType) throw serviceError("Razorpay webhook event type is missing.", "INVALID_WEBHOOK_EVENT", 422);
    const claim = await claimBillingEvent({
      provider: "razorpay",
      providerEventId: eventId,
      eventType,
      occurredAt: asDateFromUnix(payload.created_at),
      payloadHash: crypto.createHash("sha256").update(rawBody).digest("hex"),
      payloadSummary: {
        event: eventType,
        contains: Array.isArray(payload.contains) ? payload.contains.slice(0, 10) : [],
        paymentId: payload?.payload?.payment?.entity?.id || null,
        orderId: payload?.payload?.payment?.entity?.order_id || payload?.payload?.order?.entity?.id || null,
        refundId: payload?.payload?.refund?.entity?.id || null,
      },
    });
    if (!claim.claimed) return { duplicate: true, processingStatus: claim.event?.processingStatus || "processing" };

    try {
      let result;
      if (["payment.authorized", "payment.captured", "payment.failed", "order.paid"].includes(eventType)) {
        result = await this.processPaymentEvent(payload, eventType);
      } else if (["refund.created", "refund.processed", "refund.failed"].includes(eventType)) {
        result = await this.processRefundEvent(payload, eventType, eventId);
      } else {
        result = { processingStatus: "ignored" };
      }
      const aggregate = result.payment ? {
        aggregateType: "payment", aggregateId: result.payment._id, userId: result.payment.userId,
        paymentId: result.payment._id, amountMinor: result.payment.amountMinor, currency: result.payment.currency,
      }
        : result.refund ? {
          aggregateType: "refund", aggregateId: result.refund._id, userId: result.refund.userId,
          refundId: result.refund._id, paymentId: result.refund.paymentId,
          amountMinor: result.refund.amountMinor, currency: result.refund.currency,
        }
          : { aggregateType: "unknown" };
      await completeBillingEvent({
        eventId: claim.event._id,
        claimToken: claim.claimToken,
        processingStatus: result.processingStatus,
        updates: { ...aggregate, previousStatus: result.previousStatus, newStatus: result.newStatus },
      });
      return { duplicate: false, processingStatus: result.processingStatus };
    } catch (error) {
      await failBillingEvent({ eventId: claim.event._id, claimToken: claim.claimToken, error });
      throw error;
    }
  }

  async initiateRefund({ userId, refund }) {
    assertRazorpayApiConfigured(this.config);
    if (!sameId(refund.userId, userId)) throw serviceError("Refund was not found.", "REFUND_NOT_FOUND", 404);
    if (refund.providerRefundId && ["pending", "processed"].includes(refund.status)) return safeRefundData(refund);
    if (refund.status === "failed") throw serviceError("This failed refund request cannot be replayed without a new reservation.", "REFUND_ALREADY_FAILED", 409);
    const payment = await Payment.findOne({ _id: refund.paymentId, userId });
    if (!payment?.providerPaymentId) throw serviceError("Captured provider payment is unavailable for refund.", "PAYMENT_NOT_REFUNDABLE", 409);
    try {
      const providerRefund = await this.client.createRefund(payment.providerPaymentId, {
        amountMinor: refund.amountMinor,
        receipt: refund.refundReference,
        notes: { internal_refund_id: String(refund._id), internal_payment_id: String(payment._id) },
        idempotencyKey: refund.refundReference,
      });
      if (!providerRefund?.id
        || providerRefund.payment_id !== payment.providerPaymentId
        || providerRefund.amount !== refund.amountMinor
        || providerRefund.currency !== refund.currency
        || !["pending", "processed", "failed"].includes(providerRefund.status)) {
        throw serviceError("Razorpay returned refund terms that do not match the internal Refund.", "PROVIDER_REFUND_MISMATCH", 502);
      }
      if (providerRefund.status === "processed") {
        return safeRefundData(await settleRefund({ refundId: refund._id, providerRefundId: providerRefund.id }));
      }
      if (providerRefund.status === "failed") {
        return safeRefundData(await failRefund({ refundId: refund._id, providerRefundId: providerRefund.id, errorCode: "RAZORPAY_REFUND_FAILED" }));
      }
      return safeRefundData(await markRefundPending({ refundId: refund._id, providerRefundId: providerRefund.id }));
    } catch (error) {
      if (!error.retryable && error.providerStatus && error.providerStatus < 500) {
        await failRefund({ refundId: refund._id, errorCode: error.code });
      }
      throw error;
    }
  }

  async comparePaymentWithProvider(paymentId) {
    assertRazorpayApiConfigured(this.config);
    const payment = await Payment.findById(paymentId).lean();
    if (!payment) throw serviceError("Payment was not found.", "PAYMENT_NOT_FOUND", 404);
    let providerOrder = null;
    if (payment.providerOrderId) providerOrder = await this.client.fetchOrder(payment.providerOrderId);
    else {
      const collection = await this.client.listOrdersByReceipt(payment.paymentReference);
      const candidates = (collection.items || []).filter((item) => item.receipt === payment.paymentReference);
      if (candidates.length === 1) [providerOrder] = candidates;
      else if (candidates.length > 1) throw serviceError("Multiple provider orders use the internal receipt.", "PROVIDER_ORDER_DUPLICATE", 409);
    }
    const providerPayment = payment.providerPaymentId ? await this.client.fetchPayment(payment.providerPaymentId) : null;
    const mismatches = [];
    if (!providerOrder) mismatches.push("provider_order_missing");
    else {
      if (providerOrder.amount !== payment.amountMinor) mismatches.push("order_amount");
      if (providerOrder.currency !== payment.currency) mismatches.push("order_currency");
      if (providerOrder.receipt !== payment.paymentReference) mismatches.push("order_receipt");
    }
    if (providerPayment) {
      if (providerPayment.order_id !== (payment.providerOrderId || providerOrder?.id)) mismatches.push("payment_order");
      if (providerPayment.amount !== payment.amountMinor) mismatches.push("payment_amount");
      if (providerPayment.currency !== payment.currency) mismatches.push("payment_currency");
      const paymentStatusMatches = providerPayment.status === payment.status
        || payment.status === "partially_refunded" && providerPayment.status === "captured" && providerPayment.refund_status === "partial"
        || payment.status === "refunded" && providerPayment.status === "captured" && providerPayment.refund_status === "full";
      if (!paymentStatusMatches) mismatches.push("payment_status");
    }
    return {
      internalPaymentId: String(payment._id),
      providerOrderId: providerOrder?.id || payment.providerOrderId || null,
      providerPaymentId: providerPayment?.id || payment.providerPaymentId || null,
      internalStatus: payment.status,
      providerOrderStatus: providerOrder?.status || null,
      providerPaymentStatus: providerPayment?.status || null,
      matches: mismatches.length === 0,
      mismatches,
      mutationPerformed: false,
    };
  }
}

module.exports = { RazorpayBillingService, checkoutData, safeRefundData };
