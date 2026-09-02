const mongoose = require("mongoose");

const LifePushSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  endpoint: { type: String, required: true, maxlength: 4096 },
  keys: {
    p256dh: { type: String, required: true, maxlength: 1024 },
    auth: { type: String, required: true, maxlength: 512 },
  },
  expirationTime: { type: Date, default: null },
  status: { type: String, enum: ["active", "expired", "revoked"], default: "active", index: true },
  lastSuccessAt: { type: Date, default: null },
  lastFailureAt: { type: Date, default: null },
  failureCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

LifePushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
LifePushSubscriptionSchema.index({ user: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model("LifePushSubscription", LifePushSubscriptionSchema);
