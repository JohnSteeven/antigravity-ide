const mongoose = require("mongoose");
const BillingEvent = require("../models/BillingEvent");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const ReaderMembership = require("../models/ReaderMembership");
const Refund = require("../models/Refund");
const { PAYMENT_TRANSITIONS, SUBSCRIPTION_TRANSITIONS, canTransition } = require("../billing/constants");

const objectId = () => new mongoose.Types.ObjectId();

describe("production billing models", () => {
  test("Payment validates authoritative money and refund totals", async () => {
    const payment = new Payment({
      userId: objectId(),
      productCode: "PREMIUM_MONTHLY",
      market: "INDIA",
      amountMinor: 39900,
      currency: "INR",
      provider: "razorpay",
      idempotencyKey: "checkout:test:one",
      capturedAmountMinor: 39900,
      refundedAmountMinor: 30000,
      refundReservedMinor: 9900,
    });
    await expect(payment.validate()).resolves.toBeUndefined();
    payment.refundReservedMinor = 9901;
    await expect(payment.validate()).rejects.toThrow("Refunded and reserved amounts cannot exceed the captured amount");
  });

  test("Payment rejects floating minor units and unsupported currency", async () => {
    const payment = new Payment({
      userId: objectId(), productCode: "PREMIUM_MONTHLY", market: "INTERNATIONAL",
      amountMinor: 9.99, currency: "EUR", provider: "razorpay", idempotencyKey: "checkout:test:two",
    });
    await expect(payment.validate()).rejects.toThrow();
  });

  test("Invoice and Refund preserve explicit currency and validate bounded amounts", async () => {
    const userId = objectId();
    const paymentId = objectId();
    const invoice = new Invoice({
      userId, paymentId, productCode: "PREMIUM_3_MONTH", provider: "razorpay", currency: "USD",
      grossAmountMinor: 2799, indirectTaxMinor: 200, refundAmountMinor: 2799, status: "refunded",
    });
    await expect(invoice.validate()).resolves.toBeUndefined();
    invoice.chargebackAmountMinor = 1;
    await expect(invoice.validate()).rejects.toThrow("Invoice refunds and chargebacks cannot exceed gross amount");

    const refund = new Refund({
      userId, paymentId, provider: "razorpay", idempotencyKey: "refund:test:one",
      amountMinor: 1, currency: "USD", reason: "Customer request",
    });
    await expect(refund.validate()).resolves.toBeUndefined();
    refund.amountMinor = 0;
    await expect(refund.validate()).rejects.toThrow();
  });

  test("BillingEvent supports unknown provider events without requiring a mapped user", async () => {
    const event = new BillingEvent({
      provider: "razorpay",
      providerEventId: "event_test_unknown",
      eventType: "future.event",
      aggregateType: "unknown",
      payloadHash: "abc123",
    });
    await expect(event.validate()).resolves.toBeUndefined();
    expect(event.processingStatus).toBe("processing");
  });

  test("ReaderMembership remains the Subscription aggregate with priced-term audit fields", async () => {
    const membership = new ReaderMembership({
      userId: objectId(), plan: "premium", productCode: "PREMIUM_6_MONTH", market: "INDIA",
      amountMinor: 199900, currency: "INR", billingPeriodMonths: 6, billingStatus: "incomplete",
    });
    await expect(membership.validate()).resolves.toBeUndefined();
  });

  test("declares only domain-valid monotonic payment and subscription transitions", () => {
    expect(canTransition(PAYMENT_TRANSITIONS, "pending", "captured")).toBe(true);
    expect(canTransition(PAYMENT_TRANSITIONS, "captured", "pending")).toBe(false);
    expect(canTransition(PAYMENT_TRANSITIONS, "refunded", "captured")).toBe(false);
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, "incomplete", "active")).toBe(true);
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, "expired", "active")).toBe(false);
  });

  test("declares uniqueness and query indexes for every correctness boundary", () => {
    const named = (model) => model.schema.indexes().map(([, options]) => options.name);
    const optionsFor = (model, name) => model.schema.indexes().find(([, options]) => options.name === name)?.[1];
    expect(named(Payment)).toEqual(expect.arrayContaining([
      "payment_reference_unique", "payment_user_idempotency_unique", "payment_provider_order_unique",
      "payment_provider_payment_unique", "payment_user_created",
    ]));
    expect(named(Refund)).toEqual(expect.arrayContaining(["refund_reference_unique", "refund_user_idempotency_unique", "refund_provider_unique", "refund_payment_status"]));
    expect(named(Invoice)).toEqual(expect.arrayContaining(["invoice_number_unique", "invoice_payment_unique", "invoice_provider_unique", "invoice_user_issued"]));
    expect(named(BillingEvent)).toEqual(expect.arrayContaining(["billing_event_dedupe", "billing_event_aggregate_order", "billing_event_retry"]));
    [
      [Payment, "payment_user_idempotency_unique"],
      [Payment, "payment_provider_order_unique"],
      [Payment, "payment_provider_payment_unique"],
      [Refund, "refund_user_idempotency_unique"],
      [Refund, "refund_provider_unique"],
      [Invoice, "invoice_provider_unique"],
      [Invoice, "invoice_payment_unique"],
      [BillingEvent, "billing_event_dedupe"],
    ].forEach(([model, name]) => expect(optionsFor(model, name)?.unique).toBe(true));
  });
});
