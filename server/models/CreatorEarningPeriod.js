const mongoose = require("mongoose");

const CreatorEarningPeriodSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  policyVersion: { type: Number, required: true },
  qualifiedPoints: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["estimated", "finalizing", "finalized", "payable", "paid", "adjusted"], default: "estimated", index: true },
  currency: { type: String, default: null },
  premiumRevenueMinor: { type: Number, default: null, min: 0 },
  creatorPoolMinor: { type: Number, default: null, min: 0 },
  estimatedAmountMinor: { type: Number, default: null, min: 0 },
  finalizedAmountMinor: { type: Number, default: null, min: 0 },
  finalizedAt: { type: Date, default: null },
}, { timestamps: true });

CreatorEarningPeriodSchema.index({ creatorId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

module.exports = mongoose.model("CreatorEarningPeriod", CreatorEarningPeriodSchema);
