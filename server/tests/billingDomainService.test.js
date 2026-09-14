jest.mock("mongoose", () => ({ startSession: jest.fn() }));
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

const mongoose = require("mongoose");
const BillingEvent = require("../models/BillingEvent");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const {
  claimBillingEvent,
  createPaymentAttempt,
  remainingRefundableMinor,
  requestRefund,
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
});
