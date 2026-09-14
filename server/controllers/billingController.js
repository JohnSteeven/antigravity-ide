const Payment = require("../models/Payment");
const { logBillingOperation } = require("../billing/billingLogger");
const { requestRefund } = require("../services/billingDomainService");
const { RazorpayBillingService } = require("../services/razorpayBillingService");

const razorpay = new RazorpayBillingService();
const asUserId = (req) => req.user?._id || req.user?.id;

const serializePayment = (payment) => ({
  id: String(payment._id),
  productCode: payment.productCode,
  market: payment.market,
  amountMinor: payment.amountMinor,
  currency: payment.currency,
  provider: payment.provider,
  providerOrderId: payment.providerOrderId || null,
  providerPaymentId: payment.providerPaymentId || null,
  status: payment.status,
  capturedAt: payment.capturedAt || null,
  refundedAmountMinor: payment.refundedAmountMinor || 0,
  createdAt: payment.createdAt,
});

exports.getCapability = (_req, res) => res.json({ success: true, data: razorpay.capability() });

exports.createCheckoutOrder = async (req, res, next) => {
  try {
    const data = await razorpay.createCheckoutSession({
      user: req.user,
      productCode: req.body?.productCode,
      idempotencyKey: req.get("Idempotency-Key"),
      metadata: { requestId: req.id },
    });
    logBillingOperation({ requestId: req.id, operation: "checkout_order_create", result: "success", paymentId: data.internalPaymentId, providerOrderId: data.orderId });
    return res.status(201).set("Cache-Control", "private, no-store").json({ success: true, data });
  } catch (error) {
    logBillingOperation({ requestId: req.id, operation: "checkout_order_create", result: "failed", errorCode: error.code });
    return next(error);
  }
};

exports.verifyCheckoutPayment = async (req, res, next) => {
  try {
    const payment = await razorpay.verifyCheckoutPayment({
      userId: asUserId(req),
      internalPaymentId: req.body?.internalPaymentId,
      razorpayOrderId: req.body?.razorpay_order_id,
      razorpayPaymentId: req.body?.razorpay_payment_id,
      razorpaySignature: req.body?.razorpay_signature,
    });
    logBillingOperation({ requestId: req.id, operation: "checkout_payment_verify", result: "success", paymentId: payment._id, providerOrderId: payment.providerOrderId, providerPaymentId: payment.providerPaymentId });
    return res.set("Cache-Control", "private, no-store").json({ success: true, data: serializePayment(payment) });
  } catch (error) {
    logBillingOperation({ requestId: req.id, operation: "checkout_payment_verify", result: "failed", providerPaymentId: req.body?.razorpay_payment_id, errorCode: error.code });
    return next(error);
  }
};

exports.getMyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.paymentId, userId: asUserId(req) }).lean();
    if (!payment) return res.status(404).json({ message: "Payment was not found.", code: "PAYMENT_NOT_FOUND" });
    return res.set("Cache-Control", "private, no-store").json({ success: true, data: serializePayment(payment) });
  } catch (error) { return next(error); }
};

exports.createRefund = async (req, res, next) => {
  try {
    const refund = await requestRefund({
      userId: asUserId(req),
      paymentId: req.params.paymentId,
      amountMinor: req.body?.amountMinor,
      currency: req.body?.currency,
      idempotencyKey: req.get("Idempotency-Key"),
      reason: req.body?.reason,
      metadata: { requestId: req.id },
    });
    const data = await razorpay.initiateRefund({ userId: asUserId(req), refund });
    logBillingOperation({ requestId: req.id, operation: "refund_create", result: "success", paymentId: req.params.paymentId, refundId: data.id });
    return res.status(data.status === "processed" ? 200 : 202).set("Cache-Control", "private, no-store").json({ success: true, data });
  } catch (error) {
    logBillingOperation({ requestId: req.id, operation: "refund_create", result: "failed", paymentId: req.params.paymentId, errorCode: error.code });
    return next(error);
  }
};

exports.reconcilePayment = async (req, res, next) => {
  try {
    const data = await razorpay.comparePaymentWithProvider(req.params.paymentId);
    logBillingOperation({ requestId: req.id, operation: "payment_reconcile_compare", result: "success", paymentId: data.internalPaymentId, providerOrderId: data.providerOrderId, providerPaymentId: data.providerPaymentId });
    return res.set("Cache-Control", "private, no-store").json({ success: true, data });
  } catch (error) { return next(error); }
};

exports.handleRazorpayWebhook = async (req, res, next) => {
  try {
    const data = await razorpay.handleWebhook({
      rawBody: req.body,
      signature: req.get("X-Razorpay-Signature"),
      providerEventId: req.get("x-razorpay-event-id"),
    });
    logBillingOperation({ requestId: req.id, operation: "razorpay_webhook", result: "success", providerEventId: req.get("x-razorpay-event-id") });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logBillingOperation({ requestId: req.id, operation: "razorpay_webhook", result: "failed", providerEventId: req.get("x-razorpay-event-id"), errorCode: error.code });
    return next(error);
  }
};

exports.razorpay = razorpay;
exports.serializePayment = serializePayment;
