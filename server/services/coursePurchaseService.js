const Course = require("../models/Course");
const CoursePurchase = require("../models/CoursePurchase");
const Payment = require("../models/Payment");

const purchaseError = (message, code, status = 409) => Object.assign(new Error(message), { code, status });
const sameId = (left, right) => String(left || "") === String(right || "");

const serializeCoursePurchase = (purchase) => ({
  id: String(purchase._id),
  courseId: String(purchase.courseId?._id || purchase.courseId),
  course: purchase.courseId?.title ? {
    id: String(purchase.courseId._id),
    title: purchase.courseId.title,
    slug: purchase.courseId.slug,
  } : undefined,
  amountMinor: purchase.amountMinor,
  currency: purchase.currency,
  provider: purchase.provider,
  paymentStatus: purchase.paymentStatus,
  entitlementState: purchase.entitlementState,
  purchasedAt: purchase.purchasedAt,
  revokedAt: purchase.revokedAt || null,
});

const findActiveCoursePurchase = (buyerId, courseId) => {
  if (!buyerId || !courseId) return null;
  return CoursePurchase.findOne({ buyerId, courseId, paymentStatus: "captured", entitlementState: "active" }).lean();
};

const hasActiveCoursePurchase = async (buyerId, courseId) => Boolean(await findActiveCoursePurchase(buyerId, courseId));

const activateCapturedCoursePurchase = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw purchaseError("Payment was not found.", "PAYMENT_NOT_FOUND", 404);
  if (payment.purchaseType !== "course" || !payment.courseId || payment.status !== "captured"
    || payment.capturedAmountMinor !== payment.amountMinor || !payment.providerOrderId || !payment.providerPaymentId) {
    throw purchaseError("A fully captured standalone Course payment is required.", "COURSE_PAYMENT_NOT_CAPTURED");
  }

  const course = await Course.findOne({ _id: payment.courseId, monetizationType: "STANDALONE_PAID", isDeleted: false }).lean();
  if (!course) throw purchaseError("Standalone Course was not found.", "COURSE_NOT_FOUND", 404);

  const existing = await CoursePurchase.findOne({ buyerId: payment.userId, courseId: payment.courseId });
  if (existing) {
    if (!sameId(existing.paymentId, payment._id)) {
      throw purchaseError("This Course already has a different purchase entitlement.", "COURSE_ALREADY_OWNED");
    }
    if (existing.entitlementState !== "active" || existing.paymentStatus !== "captured") {
      throw purchaseError("A revoked Course purchase cannot be reactivated by replay.", "COURSE_PURCHASE_REVOKED");
    }
  }

  let purchase = existing;
  if (!purchase) {
    try {
      purchase = await CoursePurchase.create({
        buyerId: payment.userId,
        courseId: payment.courseId,
        paymentId: payment._id,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        provider: payment.provider,
        providerOrderId: payment.providerOrderId,
        providerPaymentId: payment.providerPaymentId,
        paymentStatus: "captured",
        entitlementState: "active",
        purchasedAt: payment.capturedAt || new Date(),
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      purchase = await CoursePurchase.findOne({ buyerId: payment.userId, courseId: payment.courseId });
      if (!purchase || !sameId(purchase.paymentId, payment._id)) throw purchaseError("Course entitlement activation conflicted.", "COURSE_PURCHASE_CONFLICT");
    }
  }

  await Payment.updateOne(
    { _id: payment._id, entitlementAppliedAt: null },
    { $set: { entitlementAppliedAt: purchase.purchasedAt, entitlementStart: purchase.purchasedAt } },
    { runValidators: true }
  );
  return Payment.findById(payment._id);
};

const revokeFullyRefundedCoursePurchase = async ({ payment, processedAt = new Date(), session } = {}) => {
  if (payment?.purchaseType !== "course") return null;
  const purchase = await CoursePurchase.findOneAndUpdate(
    { paymentId: payment._id, buyerId: payment.userId, courseId: payment.courseId, entitlementState: "active" },
    { $set: { paymentStatus: "refunded", entitlementState: "revoked", revokedAt: processedAt, revocationReason: "full_refund" } },
    { new: true, runValidators: true, session }
  );
  await Payment.updateOne(
    { _id: payment._id, entitlementRevokedAt: null },
    { $set: { entitlementRevokedAt: processedAt } },
    { runValidators: true, session }
  );
  return purchase;
};

const listPurchasesForBuyer = async (buyerId) => {
  const purchases = await CoursePurchase.find({ buyerId })
    .populate("courseId", "title slug")
    .sort({ purchasedAt: -1 })
    .lean();
  return purchases.map(serializeCoursePurchase);
};

const getPurchaseState = async (buyerId, courseId) => {
  if (!buyerId) return { owned: false, entitlementState: "none" };
  const purchase = await CoursePurchase.findOne({ buyerId, courseId }).lean();
  return purchase
    ? { owned: purchase.entitlementState === "active" && purchase.paymentStatus === "captured", ...serializeCoursePurchase(purchase) }
    : { owned: false, entitlementState: "none" };
};

module.exports = {
  activateCapturedCoursePurchase,
  findActiveCoursePurchase,
  getPurchaseState,
  hasActiveCoursePurchase,
  listPurchasesForBuyer,
  revokeFullyRefundedCoursePurchase,
  serializeCoursePurchase,
};
