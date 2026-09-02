const mongoose = require("mongoose");

const CreatorLedgerEntrySchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true, immutable: true },
  earningPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorEarningPeriod", required: true, index: true, immutable: true },
  type: { type: String, enum: ["engagement_earning", "bonus", "refund_adjustment", "fraud_adjustment", "payout", "carry_forward"], required: true, immutable: true },
  amountMinor: { type: Number, required: true, immutable: true },
  currency: { type: String, required: true, immutable: true },
  status: { type: String, enum: ["estimated", "finalized", "voided"], required: true, immutable: true },
  reference: { type: String, required: true, unique: true, immutable: true },
  reason: { type: String, required: true, immutable: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const immutableLedger = function immutableLedger(next) { next(Object.assign(new Error("Creator ledger entries are immutable."), { status: 409, code: "CREATOR_LEDGER_IMMUTABLE" })); };
CreatorLedgerEntrySchema.pre("updateOne", immutableLedger);
CreatorLedgerEntrySchema.pre("updateMany", immutableLedger);
CreatorLedgerEntrySchema.pre("findOneAndUpdate", immutableLedger);
CreatorLedgerEntrySchema.pre("deleteOne", immutableLedger);
CreatorLedgerEntrySchema.pre("deleteMany", immutableLedger);
CreatorLedgerEntrySchema.index({ creatorId: 1, createdAt: -1 });

module.exports = mongoose.model("CreatorLedgerEntry", CreatorLedgerEntrySchema);
