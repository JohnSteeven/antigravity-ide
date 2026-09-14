const crypto = require("crypto");
const mongoose = require("mongoose");
const { MARKETS, PRODUCT_CODES } = require("../billing/priceCatalog");
const { PAYMENT_STATUSES } = require("../billing/constants");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const PaymentSchema = new mongoose.Schema({
  paymentReference: { type: String, required: true, immutable: true, default: () => `pay_${crypto.randomUUID()}` },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  productCode: { type: String, enum: Object.values(PRODUCT_CODES), required: true, immutable: true },
  market: { type: String, enum: Object.values(MARKETS), required: true, immutable: true },
  amountMinor: minorUnitField({ required: true, immutable: true }),
  currency: currencyField({ immutable: true }),
  provider: { type: String, required: true, immutable: true, trim: true, lowercase: true },
  providerOrderId: { type: String, default: null, trim: true },
  providerPaymentId: { type: String, default: null, trim: true },
  providerSubscriptionId: { type: String, default: null, trim: true },
  status: { type: String, enum: PAYMENT_STATUSES, required: true, default: "created" },
  idempotencyKey: { type: String, required: true, immutable: true, trim: true, minlength: 8, maxlength: 128 },
  capturedAmountMinor: minorUnitField({ defaultValue: 0 }),
  refundReservedMinor: minorUnitField({ defaultValue: 0 }),
  refundedAmountMinor: minorUnitField({ defaultValue: 0 }),
  chargebackAmountMinor: minorUnitField({ defaultValue: 0 }),
  indirectTaxMinor: minorUnitField({ defaultValue: 0 }),
  processorFeeMinor: minorUnitField({ defaultValue: 0 }),
  processorFeeTaxMinor: minorUnitField({ defaultValue: 0 }),
  fxAndCrossBorderCostMinor: minorUnitField({ defaultValue: 0 }),
  appStoreCommissionMinor: minorUnitField({ defaultValue: 0 }),
  orderCreation: {
    state: { type: String, enum: ["ready", "creating", "created", "uncertain", "failed"], default: "ready" },
    claimToken: { type: String, default: null, select: false },
    leaseUntil: { type: Date, default: null, select: false },
    attempts: { type: Number, default: 0, min: 0 },
    lastErrorCode: { type: String, default: null },
  },
  authorizedAt: { type: Date, default: null },
  capturedAt: { type: Date, default: null },
  failedAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: true });

PaymentSchema.pre("validate", function validateAmounts(next) {
  if (this.capturedAmountMinor > this.amountMinor) return next(new Error("Captured amount cannot exceed the authoritative payment amount."));
  if (this.refundedAmountMinor + this.refundReservedMinor > this.capturedAmountMinor) return next(new Error("Refunded and reserved amounts cannot exceed the captured amount."));
  if (this.chargebackAmountMinor > this.capturedAmountMinor) return next(new Error("Chargeback amount cannot exceed the captured amount."));
  return next();
});

PaymentSchema.index({ paymentReference: 1 }, { unique: true, name: "payment_reference_unique" });
PaymentSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, name: "payment_user_idempotency_unique" });
PaymentSchema.index(
  { provider: 1, providerOrderId: 1 },
  { unique: true, partialFilterExpression: { providerOrderId: { $type: "string" } }, name: "payment_provider_order_unique" }
);
PaymentSchema.index(
  { provider: 1, providerPaymentId: 1 },
  { unique: true, partialFilterExpression: { providerPaymentId: { $type: "string" } }, name: "payment_provider_payment_unique" }
);
PaymentSchema.index({ userId: 1, createdAt: -1 }, { name: "payment_user_created" });

module.exports = mongoose.model("Payment", PaymentSchema);
