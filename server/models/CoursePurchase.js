const mongoose = require("mongoose");
const { PAYMENT_STATUSES } = require("../billing/constants");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const CoursePurchaseSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, immutable: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, immutable: true },
  amountMinor: minorUnitField({ required: true, immutable: true, min: 1 }),
  currency: currencyField({ immutable: true }),
  provider: { type: String, required: true, immutable: true, trim: true, lowercase: true },
  providerOrderId: { type: String, required: true, immutable: true, trim: true },
  providerPaymentId: { type: String, required: true, immutable: true, trim: true },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true, default: "captured" },
  entitlementState: { type: String, enum: ["active", "revoked"], required: true, default: "active", index: true },
  purchasedAt: { type: Date, required: true, immutable: true },
  revokedAt: { type: Date, default: null },
  revocationReason: { type: String, default: null, trim: true, maxlength: 120 },
}, { timestamps: true });

CoursePurchaseSchema.index({ buyerId: 1, courseId: 1 }, { unique: true, name: "course_purchase_buyer_course_unique" });
CoursePurchaseSchema.index({ paymentId: 1 }, { unique: true, name: "course_purchase_payment_unique" });
CoursePurchaseSchema.index({ buyerId: 1, purchasedAt: -1 }, { name: "course_purchase_buyer_history" });

module.exports = mongoose.model("CoursePurchase", CoursePurchaseSchema);
