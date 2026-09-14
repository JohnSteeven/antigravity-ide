const crypto = require("crypto");
const mongoose = require("mongoose");
const { INVOICE_STATUSES } = require("../billing/constants");
const { PRODUCT_CODES } = require("../billing/priceCatalog");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, immutable: true, default: () => `MJI-${crypto.randomUUID()}` },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "ReaderMembership", default: null, immutable: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, immutable: true },
  productCode: { type: String, enum: Object.values(PRODUCT_CODES), required: true, immutable: true },
  provider: { type: String, required: true, immutable: true, trim: true, lowercase: true },
  providerInvoiceId: { type: String, default: null, trim: true },
  currency: currencyField({ immutable: true }),
  grossAmountMinor: minorUnitField({ required: true, immutable: true }),
  indirectTaxMinor: minorUnitField({ defaultValue: null, immutable: true }),
  processorFeeMinor: minorUnitField({ defaultValue: null }),
  processorFeeTaxMinor: minorUnitField({ defaultValue: null }),
  refundAmountMinor: minorUnitField({ defaultValue: 0 }),
  chargebackAmountMinor: minorUnitField({ defaultValue: 0 }),
  fxAndCrossBorderCostMinor: minorUnitField({ defaultValue: null }),
  appStoreCommissionMinor: minorUnitField({ defaultValue: 0 }),
  netAmountMinor: minorUnitField({ defaultValue: null }),
  status: { type: String, enum: INVOICE_STATUSES, required: true, default: "draft" },
  issuedAt: { type: Date, default: null },
  paidAt: { type: Date, default: null },
  taxTreatment: { type: String, enum: ["gst_inclusive", "taxes_as_applicable", "not_determined"], default: "not_determined" },
  taxMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: true });

InvoiceSchema.pre("validate", function validateInvoiceAmounts(next) {
  if (this.indirectTaxMinor > this.grossAmountMinor) return next(new Error("Invoice tax cannot exceed gross amount."));
  if (this.refundAmountMinor + this.chargebackAmountMinor > this.grossAmountMinor) return next(new Error("Invoice refunds and chargebacks cannot exceed gross amount."));
  return next();
});

InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true, name: "invoice_number_unique" });
InvoiceSchema.index({ paymentId: 1 }, { unique: true, name: "invoice_payment_unique" });
InvoiceSchema.index(
  { provider: 1, providerInvoiceId: 1 },
  { unique: true, partialFilterExpression: { providerInvoiceId: { $type: "string" } }, name: "invoice_provider_unique" }
);
InvoiceSchema.index({ userId: 1, issuedAt: -1 }, { name: "invoice_user_issued" });

module.exports = mongoose.model("Invoice", InvoiceSchema);
