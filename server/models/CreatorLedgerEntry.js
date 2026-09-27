const mongoose = require("mongoose");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const CreatorLedgerEntrySchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true, immutable: true },
  earningPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorEarningPeriod", required: true, index: true, immutable: true },
  sourceCalculationId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorPoolCalculation", default: null, immutable: true },
  sourceInputHash: { type: String, default: null, minlength: 64, maxlength: 64, immutable: true },
  periodStart: { type: Date, default: null, immutable: true },
  periodEnd: { type: Date, default: null, immutable: true },
  type: { type: String, enum: ["engagement_earning", "bonus", "refund_adjustment", "fraud_adjustment", "payout", "carry_forward"], required: true, immutable: true },
  amountMinor: minorUnitField({ required: true, immutable: true, min: Number.MIN_SAFE_INTEGER }),
  currency: currencyField({ immutable: true }),
  status: { type: String, enum: ["estimated", "pending", "finalized", "available", "paid", "voided"], required: true, immutable: true },
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
CreatorLedgerEntrySchema.index({ creatorId: 1, status: 1, currency: 1, periodEnd: -1 }, { name: "creator_ledger_earnings_report" });
CreatorLedgerEntrySchema.index(
  { creatorId: 1, sourceCalculationId: 1, type: 1 },
  { unique: true, partialFilterExpression: { sourceCalculationId: { $type: "objectId" } }, name: "creator_ledger_source_unique" }
);

module.exports = mongoose.model("CreatorLedgerEntry", CreatorLedgerEntrySchema);
