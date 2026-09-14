const mongoose = require("mongoose");
const { BILLING_EVENT_PROCESSING_STATUSES } = require("../billing/constants");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const BillingEventSchema = new mongoose.Schema({
  provider: { type: String, required: true, trim: true },
  providerEventId: { type: String, required: true, trim: true },
  eventType: { type: String, required: true, trim: true, maxlength: 160 },
  normalizedType: { type: String, default: null, trim: true, maxlength: 160 },
  aggregateType: { type: String, enum: ["payment", "subscription", "invoice", "refund", "unknown"], required: true, default: "unknown" },
  aggregateId: { type: mongoose.Schema.Types.ObjectId, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  previousStatus: { type: String, default: null, maxlength: 80 },
  newStatus: { type: String, default: null, maxlength: 80 },
  amountMinor: minorUnitField({ defaultValue: null }),
  currency: currencyField({ required: false, defaultValue: null }),
  occurredAt: { type: Date, default: null },
  receivedAt: { type: Date, required: true, default: Date.now },
  processedAt: { type: Date, default: null },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "ReaderMembership", default: null },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
  refundId: { type: mongoose.Schema.Types.ObjectId, ref: "Refund", default: null },
  processingStatus: { type: String, enum: BILLING_EVENT_PROCESSING_STATUSES, default: "processing" },
  processingStartedAt: { type: Date, default: Date.now },
  processingLeaseUntil: { type: Date, default: null },
  processingClaimToken: { type: String, default: null, select: false },
  processingAttempts: { type: Number, default: 1, min: 1 },
  errorCode: { type: String, default: null },
  errorSummary: { type: String, default: null, maxlength: 1000 },
  payloadHash: { type: String, default: null, maxlength: 128 },
  payloadSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

BillingEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true, name: "billing_event_dedupe" });
BillingEventSchema.index({ aggregateType: 1, aggregateId: 1, receivedAt: -1 }, { name: "billing_event_aggregate_order" });
BillingEventSchema.index({ processingStatus: 1, processingLeaseUntil: 1 }, { name: "billing_event_retry" });

module.exports = mongoose.model("BillingEvent", BillingEventSchema);
