const mongoose = require("mongoose");

const LifeNotificationDeliverySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "LifeNotificationJob", required: true, index: true },
  channel: { type: String, required: true },
  attemptedAt: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ["delivered", "suppressed", "failed"], required: true },
  attempt: { type: Number, required: true },
  providerMessageId: { type: String, default: "" },
  errorCode: { type: String, default: "" },
  latencyMs: { type: Number, default: null },
}, { timestamps: true });

LifeNotificationDeliverySchema.index({ user: 1, attemptedAt: -1 });
module.exports = mongoose.model("LifeNotificationDelivery", LifeNotificationDeliverySchema);
