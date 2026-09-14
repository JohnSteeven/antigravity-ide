jest.mock("../models/Payment", () => ({
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("../models/Refund", () => ({ findOne: jest.fn() }));
jest.mock("../services/billingDomainService", () => ({
  claimBillingEvent: jest.fn(),
  completeBillingEvent: jest.fn(),
  createPaymentAttempt: jest.fn(),
  ensureInvoiceForCapturedPayment: jest.fn(),
  failBillingEvent: jest.fn(),
  failRefund: jest.fn(),
  markRefundPending: jest.fn(),
  settleRefund: jest.fn(),
  transitionPayment: jest.fn(),
}));

const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const domain = require("../services/billingDomainService");
const { hmacHex } = require("../billing/providers/razorpay/signatures");
const { RazorpayBillingService } = require("../services/razorpayBillingService");

const environment = {
  RAZORPAY_TEST_MODE: "true",
  RAZORPAY_KEY_ID: "rzp_test_example123",
  RAZORPAY_KEY_SECRET: "test_key_secret",
  RAZORPAY_WEBHOOK_SECRET: "test_webhook_secret",
};

const payment = (extra = {}) => ({
  _id: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012",
  paymentReference: "pay_550e8400-e29b-41d4-a716-446655440000",
  productCode: "PREMIUM_MONTHLY",
  market: "INDIA",
  amountMinor: 39900,
  currency: "INR",
  provider: "razorpay",
  providerOrderId: null,
  providerPaymentId: null,
  status: "created",
  orderCreation: { state: "ready" },
  ...extra,
});

const providerPayment = (extra = {}) => ({
  id: "pay_test123",
  entity: "payment",
  order_id: "order_test123",
  amount: 39900,
  currency: "INR",
  status: "captured",
  captured: true,
  amount_refunded: 0,
  fee: 900,
  tax: 137,
  ...extra,
});

const providerOrder = (extra = {}) => ({
  id: "order_test123",
  entity: "order",
  amount: 39900,
  amount_paid: 39900,
  currency: "INR",
  receipt: "pay_550e8400-e29b-41d4-a716-446655440000",
  status: "paid",
  ...extra,
});

const selected = (value) => ({ select: jest.fn().mockResolvedValue(value) });

describe("Razorpay billing orchestration", () => {
  let client;
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    client = {
      createOrder: jest.fn(),
      fetchPayment: jest.fn(),
      fetchOrder: jest.fn(),
      createRefund: jest.fn(),
      listOrdersByReceipt: jest.fn(),
    };
    service = new RazorpayBillingService({ environment, client });
  });

  test("creates an order from the server-owned Payment and returns safe checkout data", async () => {
    const internal = payment();
    domain.createPaymentAttempt.mockResolvedValue(internal);
    Payment.findOneAndUpdate
      .mockReturnValueOnce(selected({ ...internal, orderCreation: { state: "creating" } }))
      .mockResolvedValueOnce(payment({ providerOrderId: "order_test123", status: "pending", orderCreation: { state: "created" } }));
    client.createOrder.mockResolvedValue(providerOrder({ amount_paid: 0, status: "created" }));

    const result = await service.createCheckoutSession({
      user: { _id: internal.userId, countryCode: "+91" },
      productCode: "PREMIUM_MONTHLY",
      idempotencyKey: "checkout-order-one",
    });
    expect(domain.createPaymentAttempt).toHaveBeenCalledWith(expect.objectContaining({
      clientSelection: { productCode: "PREMIUM_MONTHLY" },
    }));
    expect(client.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amountMinor: 39900, currency: "INR", receipt: internal.paymentReference }));
    expect(result).toEqual(expect.objectContaining({ orderId: "order_test123", amountMinor: 39900, currency: "INR", testMode: true }));
    expect(result).not.toHaveProperty("keySecret");
  });

  test("marks a timed-out order creation uncertain and does not manufacture checkout", async () => {
    const internal = payment();
    domain.createPaymentAttempt.mockResolvedValue(internal);
    Payment.findOneAndUpdate.mockReturnValueOnce(selected(internal));
    client.createOrder.mockRejectedValue(Object.assign(new Error("timeout"), { code: "RAZORPAY_TIMEOUT", status: 502, retryable: true }));
    Payment.updateOne.mockResolvedValue({ matchedCount: 1 });
    await expect(service.createCheckoutSession({
      user: { _id: internal.userId, countryCode: "+91" }, productCode: "PREMIUM_MONTHLY", idempotencyKey: "checkout-timeout-one",
    })).rejects.toMatchObject({ code: "RAZORPAY_TIMEOUT" });
    expect(Payment.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: internal._id }),
      expect.objectContaining({ $set: expect.objectContaining({ "orderCreation.state": "uncertain" }) })
    );
  });

  test("marks an expired order-creation lease uncertain and requires reconciliation", async () => {
    const internal = payment();
    domain.createPaymentAttempt.mockResolvedValue(internal);
    Payment.findOneAndUpdate.mockReturnValueOnce(selected(null));
    Payment.findById.mockReturnValue(selected(payment({
      orderCreation: { state: "creating", leaseUntil: new Date(Date.now() - 1000) },
    })));
    Payment.updateOne.mockResolvedValue({ matchedCount: 1 });

    await expect(service.createCheckoutSession({
      user: { _id: internal.userId, countryCode: "+91" }, productCode: "PREMIUM_MONTHLY", idempotencyKey: "checkout-stale-lease-one",
    })).rejects.toMatchObject({ code: "CHECKOUT_RECONCILIATION_REQUIRED" });
    expect(Payment.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: internal._id, "orderCreation.state": "creating" }),
      expect.objectContaining({ $set: expect.objectContaining({ "orderCreation.state": "uncertain" }) })
    );
    expect(client.createOrder).not.toHaveBeenCalled();
  });

  test("verifies callback HMAC and provider captured/order-paid state before capture", async () => {
    const internal = payment({ providerOrderId: "order_test123", status: "pending" });
    Payment.findOne.mockResolvedValue(internal);
    client.fetchPayment.mockResolvedValue(providerPayment());
    client.fetchOrder.mockResolvedValue(providerOrder());
    domain.transitionPayment.mockResolvedValue(payment({ providerOrderId: "order_test123", providerPaymentId: "pay_test123", status: "captured", capturedAmountMinor: 39900 }));
    domain.ensureInvoiceForCapturedPayment.mockResolvedValue({ _id: "invoice-1" });
    const signature = hmacHex("order_test123|pay_test123", environment.RAZORPAY_KEY_SECRET);
    const result = await service.verifyCheckoutPayment({
      userId: internal.userId,
      internalPaymentId: internal._id,
      razorpayOrderId: "order_test123",
      razorpayPaymentId: "pay_test123",
      razorpaySignature: signature,
    });
    expect(result.status).toBe("captured");
    expect(domain.transitionPayment).toHaveBeenCalledWith(expect.objectContaining({
      nextStatus: "captured",
      providerPaymentId: "pay_test123",
      updates: { capturedAmountMinor: 39900, processorFeeMinor: 763, processorFeeTaxMinor: 137 },
    }));
    expect(domain.ensureInvoiceForCapturedPayment).toHaveBeenCalledTimes(1);
  });

  test("invalid callback signature performs no provider lookup or state mutation", async () => {
    const internal = payment({ providerOrderId: "order_test123", status: "pending" });
    Payment.findOne.mockResolvedValue(internal);
    await expect(service.verifyCheckoutPayment({
      userId: internal.userId, internalPaymentId: internal._id, razorpayOrderId: "order_test123",
      razorpayPaymentId: "pay_test123", razorpaySignature: "0".repeat(64),
    })).rejects.toMatchObject({ code: "INVALID_RAZORPAY_SIGNATURE" });
    expect(client.fetchPayment).not.toHaveBeenCalled();
    expect(domain.transitionPayment).not.toHaveBeenCalled();
  });

  test.each([
    [providerPayment({ amount: 1 }), providerOrder(), "PROVIDER_PAYMENT_MISMATCH"],
    [providerPayment({ currency: "USD" }), providerOrder(), "PROVIDER_PAYMENT_MISMATCH"],
    [providerPayment({ status: "authorized", captured: false }), providerOrder({ status: "attempted", amount_paid: 0 }), "PAYMENT_NOT_CAPTURED"],
  ])("rejects tampered or unconfirmed provider state", async (remotePayment, remoteOrder, code) => {
    const internal = payment({ providerOrderId: "order_test123", status: "pending" });
    Payment.findOne.mockResolvedValue(internal);
    client.fetchPayment.mockResolvedValue(remotePayment);
    client.fetchOrder.mockResolvedValue(remoteOrder);
    const signature = hmacHex("order_test123|pay_test123", environment.RAZORPAY_KEY_SECRET);
    await expect(service.verifyCheckoutPayment({
      userId: internal.userId, internalPaymentId: internal._id, razorpayOrderId: "order_test123",
      razorpayPaymentId: "pay_test123", razorpaySignature: signature,
    })).rejects.toMatchObject({ code });
    expect(domain.transitionPayment).not.toHaveBeenCalled();
  });

  test("valid captured webhook is claimed, applied once, and completed", async () => {
    const rawBody = Buffer.from(JSON.stringify({
      event: "payment.captured", created_at: 1789420000, contains: ["payment"],
      payload: { payment: { entity: providerPayment() } },
    }));
    const signature = hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET);
    const internal = payment({ providerOrderId: "order_test123", status: "pending" });
    domain.claimBillingEvent.mockResolvedValue({ claimed: true, event: { _id: "event-1" }, claimToken: "claim-1" });
    Payment.findOne.mockResolvedValue(internal);
    domain.transitionPayment.mockResolvedValue(payment({ providerOrderId: "order_test123", status: "captured" }));
    domain.ensureInvoiceForCapturedPayment.mockResolvedValue({ _id: "invoice-1" });
    domain.completeBillingEvent.mockResolvedValue({});
    const result = await service.handleWebhook({ rawBody, signature, providerEventId: "evt_capture_1" });
    expect(result).toEqual({ duplicate: false, processingStatus: "processed" });
    expect(domain.transitionPayment).toHaveBeenCalledTimes(1);
    expect(domain.completeBillingEvent).toHaveBeenCalledWith(expect.objectContaining({ processingStatus: "processed" }));
  });

  test("invalid webhook signature never claims an event or mutates billing state", async () => {
    const rawBody = Buffer.from(JSON.stringify({ event: "payment.captured" }));
    await expect(service.handleWebhook({ rawBody, signature: "0".repeat(64), providerEventId: "evt_bad" })).rejects.toMatchObject({ code: "INVALID_RAZORPAY_SIGNATURE" });
    expect(domain.claimBillingEvent).not.toHaveBeenCalled();
    expect(domain.transitionPayment).not.toHaveBeenCalled();
  });

  test("sequential and concurrent duplicate webhook deliveries produce one side effect", async () => {
    const rawBody = Buffer.from(JSON.stringify({
      event: "payment.failed", contains: ["payment"], payload: { payment: { entity: providerPayment({ status: "failed", captured: false }) } },
    }));
    const signature = hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET);
    const internal = payment({ providerOrderId: "order_test123", status: "pending" });
    domain.claimBillingEvent
      .mockResolvedValueOnce({ claimed: true, event: { _id: "event-1" }, claimToken: "claim-1" })
      .mockResolvedValue({ claimed: false, event: { _id: "event-1", processingStatus: "processed" } });
    Payment.findOne.mockResolvedValue(internal);
    domain.transitionPayment.mockResolvedValue(payment({ providerOrderId: "order_test123", status: "failed" }));
    domain.completeBillingEvent.mockResolvedValue({});
    const [first, second] = await Promise.all([
      service.handleWebhook({ rawBody, signature, providerEventId: "evt_duplicate" }),
      service.handleWebhook({ rawBody, signature, providerEventId: "evt_duplicate" }),
    ]);
    expect([first.duplicate, second.duplicate].sort()).toEqual([false, true]);
    expect(domain.transitionPayment).toHaveBeenCalledTimes(1);
    const sequential = await service.handleWebhook({ rawBody, signature, providerEventId: "evt_duplicate" });
    expect(sequential.duplicate).toBe(true);
    expect(domain.transitionPayment).toHaveBeenCalledTimes(1);
  });

  test("a duplicate refund webhook returns the durable result without refunding twice", async () => {
    const rawBody = Buffer.from(JSON.stringify({
      event: "refund.processed", payload: { refund: { entity: { id: "rfnd_test123" } } },
    }));
    const signature = hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET);
    domain.claimBillingEvent.mockResolvedValue({ claimed: false, event: { _id: "event-refund", processingStatus: "processed" } });

    await expect(service.handleWebhook({ rawBody, signature, providerEventId: "evt_refund_duplicate" }))
      .resolves.toEqual({ duplicate: true, processingStatus: "processed" });
    expect(domain.settleRefund).not.toHaveBeenCalled();
    expect(domain.markRefundPending).not.toHaveBeenCalled();
    expect(domain.failRefund).not.toHaveBeenCalled();
  });

  test("unknown events are durably recorded and explicitly ignored", async () => {
    const rawBody = Buffer.from(JSON.stringify({ event: "future.unknown", contains: [] }));
    const signature = hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET);
    domain.claimBillingEvent.mockResolvedValue({ claimed: true, event: { _id: "event-unknown" }, claimToken: "claim-unknown" });
    domain.completeBillingEvent.mockResolvedValue({});
    await expect(service.handleWebhook({ rawBody, signature, providerEventId: "evt_unknown" })).resolves.toEqual({ duplicate: false, processingStatus: "ignored" });
    expect(domain.completeBillingEvent).toHaveBeenCalledWith(expect.objectContaining({ processingStatus: "ignored" }));
  });

  test("out-of-order payment events are completed as ignored without rollback", async () => {
    const internal = payment({ providerOrderId: "order_test123", status: "refunded" });
    Payment.findOne.mockResolvedValue(internal);
    domain.transitionPayment.mockRejectedValue(Object.assign(new Error("rollback"), { code: "INVALID_PAYMENT_TRANSITION" }));
    await expect(service.processPaymentEvent({ payload: { payment: { entity: providerPayment() } } }, "payment.captured"))
      .resolves.toMatchObject({ processingStatus: "ignored", previousStatus: "refunded", newStatus: "refunded" });
  });

  test.each([
    ["refund.created", "pending", "markRefundPending"],
    ["refund.processed", "processed", "settleRefund"],
    ["refund.failed", "failed", "failRefund"],
  ])("handles %s using the refund state boundary", async (eventType, status, method) => {
    const internalRefund = { _id: "refund-1", userId: "user-1", paymentId: "payment-1", provider: "razorpay", providerRefundId: "rfnd_test123", refundReference: "ref_internal", amountMinor: 400, currency: "INR", status: "requested" };
    Refund.findOne.mockResolvedValue(internalRefund);
    Payment.findById.mockResolvedValue({ _id: "payment-1", providerPaymentId: "pay_test123" });
    domain[method].mockResolvedValue({ ...internalRefund, status });
    const result = await service.processRefundEvent({ payload: { refund: { entity: { id: "rfnd_test123", payment_id: "pay_test123", amount: 400, currency: "INR", status } } } }, eventType, "evt_refund");
    expect(result).toMatchObject({ processingStatus: "processed", newStatus: status });
    expect(domain[method]).toHaveBeenCalledTimes(1);
  });

  test("ignores a delayed failed refund event after the refund was processed", async () => {
    const internalRefund = { _id: "refund-1", userId: "user-1", paymentId: "payment-1", provider: "razorpay", providerRefundId: "rfnd_test123", amountMinor: 400, currency: "INR", status: "processed" };
    Refund.findOne.mockResolvedValue(internalRefund);
    Payment.findById.mockResolvedValue({ _id: "payment-1", providerPaymentId: "pay_test123" });
    const result = await service.processRefundEvent({ payload: { refund: { entity: { id: "rfnd_test123", payment_id: "pay_test123", amount: 400, currency: "INR", status: "failed" } } } }, "refund.failed", "evt_old_refund");
    expect(result).toMatchObject({ processingStatus: "ignored", previousStatus: "processed", newStatus: "processed" });
    expect(domain.failRefund).not.toHaveBeenCalled();
  });

  test.each([
    [400, "pending", "markRefundPending"],
    [999, "processed", "settleRefund"],
  ])("initiates a %i-minor refund and preserves provider status %s", async (amountMinor, status, method) => {
    const internalRefund = {
      _id: "refund-1", userId: "user-1", paymentId: "payment-1", provider: "razorpay",
      refundReference: "ref_550e8400-e29b-41d4-a716-446655440000", amountMinor, currency: "USD", status: "requested",
    };
    Payment.findOne.mockResolvedValue({ _id: "payment-1", userId: "user-1", providerPaymentId: "pay_test123" });
    client.createRefund.mockResolvedValue({ id: "rfnd_test123", payment_id: "pay_test123", amount: amountMinor, currency: "USD", status });
    domain[method].mockResolvedValue({ ...internalRefund, providerRefundId: "rfnd_test123", status });
    const result = await service.initiateRefund({ userId: "user-1", refund: internalRefund });
    expect(result).toMatchObject({ amountMinor, currency: "USD", status });
    expect(client.createRefund).toHaveBeenCalledWith("pay_test123", expect.objectContaining({
      amountMinor,
      idempotencyKey: internalRefund.refundReference,
    }));
  });

  test("keeps a refund reserved after provider timeout so reconciliation can recover safely", async () => {
    const internalRefund = {
      _id: "refund-1", userId: "user-1", paymentId: "payment-1", provider: "razorpay",
      refundReference: "ref_550e8400-e29b-41d4-a716-446655440000", amountMinor: 400, currency: "USD", status: "requested",
    };
    Payment.findOne.mockResolvedValue({ _id: "payment-1", userId: "user-1", providerPaymentId: "pay_test123" });
    client.createRefund.mockRejectedValue(Object.assign(new Error("timeout"), { code: "RAZORPAY_TIMEOUT", retryable: true, providerStatus: null }));
    await expect(service.initiateRefund({ userId: "user-1", refund: internalRefund })).rejects.toMatchObject({ code: "RAZORPAY_TIMEOUT" });
    expect(domain.failRefund).not.toHaveBeenCalled();
  });

  test("records a safe failed event when verified webhook processing fails", async () => {
    const rawBody = Buffer.from(JSON.stringify({
      event: "payment.captured", payload: { payment: { entity: providerPayment() } },
    }));
    const signature = hmacHex(rawBody, environment.RAZORPAY_WEBHOOK_SECRET);
    domain.claimBillingEvent.mockResolvedValue({ claimed: true, event: { _id: "event-failed" }, claimToken: "claim-failed" });
    Payment.findOne.mockResolvedValue(null);
    domain.failBillingEvent.mockResolvedValue({ processingStatus: "failed" });
    await expect(service.handleWebhook({ rawBody, signature, providerEventId: "evt_processing_failure" })).rejects.toMatchObject({ code: "PAYMENT_MAPPING_NOT_FOUND" });
    expect(domain.failBillingEvent).toHaveBeenCalledWith(expect.objectContaining({ eventId: "event-failed", claimToken: "claim-failed" }));
    expect(domain.completeBillingEvent).not.toHaveBeenCalled();
  });

  test("reconciliation compares selected internal and provider records without mutation", async () => {
    Payment.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(payment({ providerOrderId: "order_test123", providerPaymentId: "pay_test123", status: "captured" })) });
    client.fetchOrder.mockResolvedValue(providerOrder());
    client.fetchPayment.mockResolvedValue(providerPayment());
    const report = await service.comparePaymentWithProvider("payment-1");
    expect(report).toMatchObject({ matches: true, mutationPerformed: false, providerOrderId: "order_test123", providerPaymentId: "pay_test123" });
    expect(Payment.updateOne).not.toHaveBeenCalled();
  });

  test("reconciliation recognizes Razorpay's captured-plus-full-refund representation", async () => {
    Payment.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(payment({
      providerOrderId: "order_test123", providerPaymentId: "pay_test123", status: "refunded",
    })) });
    client.fetchOrder.mockResolvedValue(providerOrder());
    client.fetchPayment.mockResolvedValue(providerPayment({ refund_status: "full" }));
    await expect(service.comparePaymentWithProvider("payment-1")).resolves.toMatchObject({ matches: true, mismatches: [] });
  });
});
