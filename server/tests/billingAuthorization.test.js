jest.mock("../middleware/auth", () => ({
  authenticate: (req, res, next) => {
    const identity = req.get("x-test-user");
    if (!identity) return res.status(401).json({ message: "Authentication required." });
    req.user = { _id: identity, role: req.get("x-test-role") || "Reader", countryCode: "+91" };
    return next();
  },
}));
jest.mock("../models/Payment", () => ({ findOne: jest.fn() }));
jest.mock("../services/premiumLifecycleService", () => ({ activateCapturedPayment: jest.fn(), noteFailedPayment: jest.fn() }));
jest.mock("../services/billingDomainService", () => ({
  claimBillingEvent: jest.fn(), completeBillingEvent: jest.fn(), createPaymentAttempt: jest.fn(),
  ensureInvoiceForCapturedPayment: jest.fn(),
  failBillingEvent: jest.fn(), failRefund: jest.fn(), markRefundPending: jest.fn(), requestRefund: jest.fn(),
  settleRefund: jest.fn(), transitionPayment: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const Payment = require("../models/Payment");
const billingController = require("../controllers/billingController");
const billingRoutes = require("../routes/billingRoutes");

const query = (value) => ({ lean: jest.fn().mockResolvedValue(value) });

describe("billing API authorization", () => {
  let app;
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/billing", billingRoutes);
    app.use((error, req, res, next) => res.status(error.status || 500).json({ code: error.code, message: error.message }));
  });

  test.each([
    ["post", "/api/billing/checkout/orders"],
    ["post", "/api/billing/checkout/verify"],
    ["get", "/api/billing/payments/payment-1"],
    ["post", "/api/billing/payments/payment-1/refunds"],
  ])("%s %s requires authentication", async (method, path) => {
    const response = await request(app)[method](path).send({});
    expect(response.status).toBe(401);
  });

  test("payment reads are always scoped to the authenticated owner and hide cross-user records", async () => {
    Payment.findOne.mockReturnValue(query(null));
    const response = await request(app).get("/api/billing/payments/payment-owned-by-someone-else").set("x-test-user", "authenticated-user");
    expect(response.status).toBe(404);
    expect(Payment.findOne).toHaveBeenCalledWith({ _id: "payment-owned-by-someone-else", userId: "authenticated-user" });
  });

  test("checkout forwards only product selection and server-owned user identity", async () => {
    jest.spyOn(billingController.razorpay, "createCheckoutSession").mockResolvedValue({
      internalPaymentId: "payment-1", orderId: "order_test123", productCode: "PREMIUM_12_MONTH",
      market: "INDIA", amountMinor: 349900, currency: "INR", testMode: true,
    });
    const response = await request(app)
      .post("/api/billing/checkout/orders")
      .set("x-test-user", "authenticated-user")
      .set("Idempotency-Key", "checkout-auth-one")
      .send({ productCode: "PREMIUM_12_MONTH", amountMinor: 1, currency: "USD", durationMonths: 1, premiumUntil: "2099-01-01" });
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ amountMinor: 349900, currency: "INR" });
    expect(billingController.razorpay.createCheckoutSession).toHaveBeenCalledWith({
      user: expect.objectContaining({ _id: "authenticated-user" }),
      productCode: "PREMIUM_12_MONTH",
      idempotencyKey: "checkout-auth-one",
      metadata: { requestId: undefined },
    });
  });

  test("non-admin accounts cannot access reconciliation", async () => {
    const response = await request(app).get("/api/billing/admin/reconcile/payments/payment-1").set("x-test-user", "reader-1");
    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Admin access required.");
  });

  test("refund requests derive ownership from the session and ignore body userId", async () => {
    const domain = require("../services/billingDomainService");
    domain.requestRefund.mockResolvedValue({ _id: "refund-1", userId: "authenticated-user", paymentId: "payment-1" });
    jest.spyOn(billingController.razorpay, "initiateRefund").mockResolvedValue({ id: "refund-1", paymentId: "payment-1", amountMinor: 100, currency: "INR", status: "pending" });
    const response = await request(app)
      .post("/api/billing/payments/payment-1/refunds")
      .set("x-test-user", "authenticated-user")
      .set("Idempotency-Key", "refund-owner-one")
      .send({ userId: "victim-user", amountMinor: 100, currency: "INR", reason: "Request" });
    expect(response.status).toBe(202);
    expect(domain.requestRefund).toHaveBeenCalledWith(expect.objectContaining({ userId: "authenticated-user", paymentId: "payment-1" }));
    expect(domain.requestRefund.mock.calls[0][0]).not.toHaveProperty("userId", "victim-user");
  });
});
