jest.mock("../models/Course", () => ({ findOne: jest.fn() }));
jest.mock("../models/CoursePurchase", () => ({
  create: jest.fn(),
  exists: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock("../models/Payment", () => ({ findById: jest.fn(), updateOne: jest.fn() }));

const Course = require("../models/Course");
const CoursePurchase = require("../models/CoursePurchase");
const Payment = require("../models/Payment");
const {
  activateCapturedCoursePurchase,
  listPurchasesForBuyer,
  revokeFullyRefundedCoursePurchase,
} = require("../services/coursePurchaseService");

const capturedPayment = (overrides = {}) => ({
  _id: "payment-a",
  userId: "buyer-a",
  courseId: "course-a",
  purchaseType: "course",
  amountMinor: 99900,
  capturedAmountMinor: 99900,
  currency: "INR",
  provider: "razorpay",
  providerOrderId: "order-a",
  providerPaymentId: "provider-payment-a",
  productCode: "COURSE_PURCHASE",
  status: "captured",
  capturedAt: new Date("2026-09-20T10:00:00.000Z"),
  ...overrides,
});

const courseQuery = (value) => ({ lean: jest.fn().mockResolvedValue(value) });

describe("standalone Course purchase lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Payment.findById.mockResolvedValue(capturedPayment());
    Payment.updateOne.mockResolvedValue({ matchedCount: 1 });
    Course.findOne.mockReturnValue(courseQuery({ _id: "course-a", monetizationType: "STANDALONE_PAID" }));
  });

  test("a verified full capture creates one exact immutable entitlement", async () => {
    const purchase = {
      _id: "purchase-a", buyerId: "buyer-a", courseId: "course-a", paymentId: "payment-a",
      amountMinor: 99900, currency: "INR", paymentStatus: "captured", entitlementState: "active",
      purchasedAt: new Date("2026-09-20T10:00:00.000Z"),
    };
    CoursePurchase.findOne.mockResolvedValue(null);
    CoursePurchase.create.mockResolvedValue(purchase);

    await expect(activateCapturedCoursePurchase("payment-a")).resolves.toMatchObject({ _id: "payment-a" });
    expect(CoursePurchase.create).toHaveBeenCalledWith(expect.objectContaining({
      buyerId: "buyer-a", courseId: "course-a", paymentId: "payment-a",
      amountMinor: 99900, currency: "INR", providerOrderId: "order-a", providerPaymentId: "provider-payment-a",
    }));
  });

  test("callback or webhook replay reuses the same entitlement", async () => {
    CoursePurchase.findOne.mockResolvedValue({
      _id: "purchase-a", buyerId: "buyer-a", courseId: "course-a", paymentId: "payment-a",
      paymentStatus: "captured", entitlementState: "active", purchasedAt: new Date("2026-09-20T10:00:00.000Z"),
    });
    await activateCapturedCoursePurchase("payment-a");
    await activateCapturedCoursePurchase("payment-a");
    expect(CoursePurchase.create).not.toHaveBeenCalled();
  });

  test("failed or partial payments never create entitlement", async () => {
    Payment.findById.mockResolvedValue(capturedPayment({ status: "failed", capturedAmountMinor: 0 }));
    await expect(activateCapturedCoursePurchase("payment-a")).rejects.toMatchObject({ code: "COURSE_PAYMENT_NOT_CAPTURED" });
    expect(CoursePurchase.create).not.toHaveBeenCalled();
  });

  test("full refund revokes only the purchase attributed to that Payment", async () => {
    CoursePurchase.findOneAndUpdate.mockResolvedValue({ _id: "purchase-a", entitlementState: "revoked" });
    await revokeFullyRefundedCoursePurchase({ payment: capturedPayment(), processedAt: new Date("2026-09-25T00:00:00.000Z") });
    expect(CoursePurchase.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "payment-a", buyerId: "buyer-a", courseId: "course-a", entitlementState: "active" }),
      expect.objectContaining({ $set: expect.objectContaining({ paymentStatus: "refunded", entitlementState: "revoked", revocationReason: "full_refund" }) }),
      expect.objectContaining({ new: true })
    );
  });

  test("purchase history is scoped to the authenticated buyer and omits provider references", async () => {
    const lean = jest.fn().mockResolvedValue([{
      _id: "purchase-a", buyerId: "buyer-a", courseId: { _id: "course-a", title: "Course A", slug: "course-a" },
      amountMinor: 99900, currency: "INR", provider: "razorpay", providerOrderId: "secret-order",
      providerPaymentId: "secret-payment", paymentStatus: "captured", entitlementState: "active", purchasedAt: new Date(),
    }]);
    const sort = jest.fn().mockReturnValue({ lean });
    const populate = jest.fn().mockReturnValue({ sort });
    CoursePurchase.find.mockReturnValue({ populate });
    const result = await listPurchasesForBuyer("buyer-a");
    expect(CoursePurchase.find).toHaveBeenCalledWith({ buyerId: "buyer-a" });
    expect(result[0]).not.toHaveProperty("providerOrderId");
    expect(result[0]).not.toHaveProperty("providerPaymentId");
  });
});
