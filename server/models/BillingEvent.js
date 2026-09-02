const mongoose = require("mongoose");

const BillingEventSchema = new mongoose.Schema({
  provider: { type: String, required: true, trim: true },
  providerEventId: { type: String, required: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  normalizedType: {
    type: String,
    enum: [
      "subscription_started", "subscription_renewed", "subscription_cancel_scheduled",
      "subscription_canceled", "subscription_expired", "payment_failed",
      "payment_recovered", "trial_started", "trial_ended",
    ],
    required: true,
  },
  occurredAt: { type: Date, required: true },
  processedAt: { type: Date, default: null },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "ReaderMembership", default: null },
  status: { type: String, enum: ["received", "processed", "ignored", "failed"], default: "received" },
  errorCode: { type: String, default: null },
}, { timestamps: true });

BillingEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true, name: "billing_event_dedupe" });
BillingEventSchema.index({ subscriptionId: 1, occurredAt: -1 }, { name: "billing_event_subscription_order" });

module.exports = mongoose.model("BillingEvent", BillingEventSchema);
