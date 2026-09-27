const mongoose = require("mongoose");
const Course = require("../models/Course");
const CoursePurchase = require("../models/CoursePurchase");
const Payment = require("../models/Payment");

const objectId = () => new mongoose.Types.ObjectId();

describe("standalone Course commerce models", () => {
  test("standalone Courses require integer minor-unit pricing", async () => {
    const course = new Course({
      creatorId: objectId(), title: "Paid Course", slug: "paid-course", description: "A Course",
      language: "English", monetizationType: "STANDALONE_PAID", accessLevel: "free",
      priceMinor: 99900, currency: "INR", rightsConfirmedAt: new Date(),
    });
    await expect(course.validate()).resolves.toBeUndefined();
    course.priceMinor = null;
    await expect(course.validate()).rejects.toThrow("authoritative positive price");
  });

  test("Course payments preserve target and terms without requiring Premium membership dates", async () => {
    const courseId = objectId();
    const payment = new Payment({
      userId: objectId(), purchaseType: "course", productCode: "COURSE_PURCHASE", courseId,
      market: "INDIA", amountMinor: 99900, currency: "INR", provider: "razorpay",
      idempotencyKey: "course:model:test", status: "captured", capturedAmountMinor: 99900,
      entitlementAppliedAt: new Date(), entitlementStart: new Date(),
    });
    await expect(payment.validate()).resolves.toBeUndefined();
  });

  test("Course purchase correctness boundaries are unique", () => {
    const indexes = CoursePurchase.schema.indexes();
    const index = (name) => indexes.find(([, options]) => options.name === name)?.[1];
    expect(index("course_purchase_buyer_course_unique")?.unique).toBe(true);
    expect(index("course_purchase_payment_unique")?.unique).toBe(true);
  });
});
