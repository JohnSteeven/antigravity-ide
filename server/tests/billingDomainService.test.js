jest.mock("mongoose", () => ({ startSession: jest.fn() }));
jest.mock("../services/premiumLifecycleService", () => ({ revokeFullyRefundedPayment: jest.fn() }));
jest.mock("../models/Payment", () => ({
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("../models/Refund", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/BillingEvent", () => ({
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock("../models/Invoice", () => ({ findOneAndUpdate: jest.fn(), updateOne: jest.fn() }));

const mongoose = require("mongoose");
const BillingEvent = require("../models/BillingEvent");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const {
  claimBillingEvent,
  createPaymentAttempt,
  ensureInvoiceForCapturedPayment,
  failRefund,
  remainingRefundableMinor,
  requestRefund,
  settleRefund,
  transitionPayment,
} = require("../services/billingDomainService");

const sessionQuery = (value) => ({ session: jest.fn().mockResolvedValue(value) });

describe("billing domain service", () => {
  beforeEach(() => jest.clearAllMocks());

  test("creates idempotent payment attempts from server catalog terms only", async () => {
    Payment.findOneAndUpdate.mockResolvedValue({
      _id: "payment-1", userId: "user-1", idempotencyKey: "checkout:fixed:1",
      productCode: "PREMIUM_12_MONTH", market: "INDIA", amountMinor: 349900, currency: "INR",
    });
    const result = await createPaymentAttempt({
      user: { _id: "user-1", countryCode: "+91" },
      idempotencyKey: "checkout:fixed:1",
      clientSelection: { productCode: "PREMIUM_12_MONTH", amountMinor: 1, currency: "USD", durationMonths: 1 },
      metadata: { card: "should-not-store", campaign: "launch" },
    });
    expect(result.amountMinor).toBe(349900);
    const inserted = Payment.findOneAndUpdate.mock.calls[0][1].$setOnInsert;
    expect(inserted).toMatchObject({ amountMinor: 349900, currency: "INR", productCode: "PREMIUM_12_MONTH" });
    expect(inserted.metadata).toEqual({ card: "[REDACTED]", campaign: "launch" });
  });

  test("rejects reuse of an idempotency key with different authoritative terms", async () => {
    Payment.findOneAndUpdate.mockResolvedValue({
      productCode: "PREMIUM_MONTHLY", market: "INDIA", amountMinor: 39900, currency: "INR",
    });
    await expect(createPaymentAttempt({
      user: { _id: "user-1", countryCode: "+91" }, idempotencyKey: "checkout:conflict",
      clientSelection: { productCode: "PREMIUM_12_MONTH" },
    })).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  test("prevents payment state rollback and accepts an idempotent repeat", async () => {
    Payment.findOneAndUpdate.mockResolvedValueOnce(null);
    Payment.findById.mockReturnValueOnce(sessionQuery({ _id: "payment-1", status: "refunded" }));
    await expect(transitionPayment({ paymentId: "payment-1", nextStatus: "captured" })).rejects.toMatchObject({ code: "INVALID_PAYMENT_TRANSITION" });

    Payment.findOneAndUpdate.mockResolvedValueOnce(null);
    Payment.findById.mockReturnValueOnce(sessionQuery({ _id: "payment-1", status: "captured" }));
    await expect(transitionPayment({ paymentId: "payment-1", nextStatus: "captured" })).resolves.toMatchObject({ status: "captured" });
  });

  test("computes remaining refundable funds from captured less processed and reserved", () => {
    expect(remainingRefundableMinor({ capturedAmountMinor: 39900, refundedAmountMinor: 10000, refundReservedMinor: 5000 })).toBe(24900);
    expect(remainingRefundableMinor({ capturedAmountMinor: 100, refundedAmountMinor: 200 })).toBe(0);
  });

  test("creates one internal invoice snapshot per captured Payment without inventing unknown tax", async () => {
    Invoice.findOneAndUpdate.mockResolvedValue({ _id: "invoice-1" });
    await ensureInvoiceForCapturedPayment({
      _id: "payment-1", userId: "user-1", productCode: "PREMIUM_MONTHLY", market: "INDIA",
      amountMinor: 39900, capturedAmountMinor: 39900, currency: "INR", provider: "razorpay",
      status: "captured", capturedAt: new Date("2026-09-15T00:00:00.000Z"),
      indirectTaxMinor: null, processorFeeMinor: 1000, processorFeeTaxMinor: 180,
      refundedAmountMinor: 0, chargebackAmountMinor: 0, fxAndCrossBorderCostMinor: null, appStoreCommissionMinor: 0,
    });
    const update = Invoice.findOneAndUpdate.mock.calls[0][1];
    expect(update.$setOnInsert).toMatchObject({ grossAmountMinor: 39900, currency: "INR", indirectTaxMinor: null, taxTreatment: "gst_inclusive" });
    expect(update.$set.netAmountMinor).toBeNull();
    expect(Invoice.findOneAndUpdate).toHaveBeenCalledWith(
      { paymentId: "payment-1" }, expect.any(Object), expect.objectContaining({ upsert: true })
    );
  });

  test("rejects a refund greater than remaining captured funds inside a transaction", async () => {
    const session = { withTransaction: jest.fn(async (work) => work()), endSession: jest.fn() };
    mongoose.startSession.mockResolvedValue(session);
    Refund.findOne.mockReturnValue(sessionQuery(null));
    Payment.findOne.mockReturnValue(sessionQuery({
      _id: "payment-1", provider: "razorpay", status: "partially_refunded", currency: "INR",
      capturedAmountMinor: 39900, refundedAmountMinor: 30000, refundReservedMinor: 0,
    }));
    await expect(requestRefund({
      userId: "user-1", paymentId: "payment-1", amountMinor: 10000, currency: "INR",
      idempotencyKey: "refund:too-large", reason: "Requested",
    })).rejects.toMatchObject({ code: "REFUND_EXCEEDS_CAPTURED_AMOUNT" });
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  test("reserves a valid partial refund atomically before creating its audit record", async () => {
    const session = { withTransaction: jest.fn(async (work) => work()), endSession: jest.fn() };
    mongoose.startSession.mockResolvedValue(session);
    Refund.findOne.mockReturnValue(sessionQuery(null));
    Payment.findOne.mockReturnValue(sessionQuery({
      _id: "payment-1", provider: "razorpay", status: "captured", currency: "USD",
      capturedAmountMinor: 999, refundedAmountMinor: 0, refundReservedMinor: 0,
    }));
    Payment.findOneAndUpdate.mockResolvedValue({ _id: "payment-1", refundReservedMinor: 400 });
    Refund.create.mockResolvedValue([{ _id: "refund-1", amountMinor: 400, currency: "USD", status: "requested" }]);
    const result = await requestRefund({
      userId: "user-1", paymentId: "payment-1", amountMinor: 400, currency: "USD",
      idempotencyKey: "refund:partial:one", reason: "Partial service credit",
    });
    expect(result).toMatchObject({ amountMinor: 400, currency: "USD" });
    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "payment-1", $expr: expect.any(Object) }),
      { $inc: { refundReservedMinor: 400 } },
      expect.objectContaining({ session })
    );
    expect(Refund.create).toHaveBeenCalledWith([expect.objectContaining({ amountMinor: 400, currency: "USD" })], { session });
  });

  test("settles the remaining full refund atomically and updates the invoice", async () => {
    const session = { withTransaction: jest.fn(async (work) => work()), endSession: jest.fn() };
    mongoose.startSession.mockResolvedValue(session);
    Refund.findById.mockReturnValue(sessionQuery({
      _id: "refund-2", paymentId: "payment-1", amountMinor: 599, status: "pending",
    }));
    Payment.findById.mockReturnValue(sessionQuery({
      _id: "payment-1", capturedAmountMinor: 999, refundedAmountMinor: 400, refundReservedMinor: 599,
    }));
    Payment.updateOne.mockResolvedValue({ matchedCount: 1 });
    Invoice.updateOne.mockResolvedValue({ matchedCount: 1 });
    Refund.findOneAndUpdate.mockResolvedValue({ _id: "refund-2", status: "processed" });

    await expect(settleRefund({ refundId: "refund-2", providerRefundId: "rfnd_test123" }))
      .resolves.toMatchObject({ status: "processed" });
    expect(Payment.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "payment-1", refundReservedMinor: { $gte: 599 } }),
      { $inc: { refundReservedMinor: -599, refundedAmountMinor: 599 }, $set: { status: "refunded" } },
      expect.objectContaining({ session })
    );
    expect(Invoice.findOneAndUpdate).toHaveBeenCalledWith(
      { paymentId: "payment-1" },
      expect.objectContaining({ $set: expect.objectContaining({ refundAmountMinor: 999, status: "refunded" }) }),
      expect.objectContaining({ session, upsert: true })
    );
    expect(require("../services/premiumLifecycleService").revokeFullyRefundedPayment)
      .toHaveBeenCalledWith(expect.objectContaining({ session, payment: expect.objectContaining({ _id: "payment-1" }) }));
  });

  test("a definitive refund failure releases its reservation atomically", async () => {
    const session = { withTransaction: jest.fn(async (work) => work()), endSession: jest.fn() };
    mongoose.startSession.mockResolvedValue(session);
    Refund.findById.mockReturnValue(sessionQuery({
      _id: "refund-1", paymentId: "payment-1", amountMinor: 400, status: "requested", providerRefundId: null,
    }));
    Payment.updateOne.mockResolvedValue({ matchedCount: 1 });
    Refund.findOneAndUpdate.mockResolvedValue({ _id: "refund-1", status: "failed" });

    await expect(failRefund({ refundId: "refund-1", errorCode: "BAD_REQUEST_ERROR" }))
      .resolves.toMatchObject({ status: "failed" });
    expect(Payment.updateOne).toHaveBeenCalledWith(
      { _id: "payment-1", refundReservedMinor: { $gte: 400 } },
      { $inc: { refundReservedMinor: -400 } },
      expect.objectContaining({ session })
    );
  });

  test("database uniqueness makes concurrent duplicate event delivery a no-op", async () => {
    BillingEvent.create.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    BillingEvent.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    BillingEvent.findOne.mockResolvedValue({ _id: "event-1", processingStatus: "processing" });
    const result = await claimBillingEvent({ provider: "razorpay", providerEventId: "evt_1", eventType: "payment.captured" });
    expect(result).toMatchObject({ claimed: false, claimToken: null });
    expect(BillingEvent.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "razorpay", providerEventId: "evt_1" }),
      expect.any(Object),
      { new: true }
    );
  });

  test("failed or expired durable event claims can be reclaimed for recovery", async () => {
    BillingEvent.create.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    BillingEvent.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: "event-1", processingStatus: "processing" }) });
    const result = await claimBillingEvent({ provider: "razorpay", providerEventId: "evt_retry", eventType: "refund.processed" });
    expect(result.claimed).toBe(true);
    expect(result.claimToken).toEqual(expect.any(String));
  });

  test("rejects reuse of a provider event ID with different signed content", async () => {
    BillingEvent.create.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    BillingEvent.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    BillingEvent.findOne.mockResolvedValue({ _id: "event-1", processingStatus: "processed", payloadHash: "original-hash" });
    await expect(claimBillingEvent({
      provider: "razorpay", providerEventId: "evt_changed", eventType: "payment.captured", payloadHash: "changed-hash",
    })).rejects.toMatchObject({ code: "PROVIDER_EVENT_PAYLOAD_MISMATCH" });
  });
});
