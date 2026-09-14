const crypto = require("crypto");
const mongoose = require("mongoose");
const { REFUND_STATUSES } = require("../billing/constants");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const RefundSchema = new mongoose.Schema({
  refundReference: { type: String, required: true, immutable: true, default: () => `ref_${crypto.randomUUID()}` },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, immutable: true },
  provider: { type: String, required: true, immutable: true, trim: true, lowercase: true },
  providerRefundId: { type: String, default: null, trim: true },
  idempotencyKey: { type: String, required: true, immutable: true, trim: true, minlength: 8, maxlength: 128 },
  amountMinor: minorUnitField({ required: true, immutable: true, min: 1 }),
  currency: currencyField({ immutable: true }),
  status: { type: String, enum: REFUND_STATUSES, required: true, default: "requested" },
  reason: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
  requestedAt: { type: Date, required: true, default: Date.now, immutable: true },
  processedAt: { type: Date, default: null },
  failedAt: { type: Date, default: null },
  providerEventId: { type: String, default: null, trim: true },
  billingEventId: { type: mongoose.Schema.Types.ObjectId, ref: "BillingEvent", default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: true });

RefundSchema.index({ refundReference: 1 }, { unique: true, name: "refund_reference_unique" });
RefundSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, name: "refund_user_idempotency_unique" });
RefundSchema.index(
  { provider: 1, providerRefundId: 1 },
  { unique: true, partialFilterExpression: { providerRefundId: { $type: "string" } }, name: "refund_provider_unique" }
);
RefundSchema.index({ paymentId: 1, status: 1 }, { name: "refund_payment_status" });

module.exports = mongoose.model("Refund", RefundSchema);
