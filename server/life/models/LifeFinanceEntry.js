const mongoose = require("mongoose");
const { FINANCE_ENTRY_TYPES } = require("../domain/constants");
const { SourceSchema } = require("./shared");

const LifeFinanceEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: FINANCE_ENTRY_TYPES, required: true, index: true },
  amountMinor: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  category: { type: String, default: "Other", maxlength: 80 },
  payee: { type: String, default: "", maxlength: 160 },
  occurredAt: { type: Date, required: true, default: Date.now },
  localDate: { type: String, required: true, index: true },
  paymentMethod: { type: String, default: "", maxlength: 80 },
  note: { type: String, default: "", maxlength: 2000 },
  recurring: { type: Boolean, default: false },
  linkedFinancialGoal: { type: mongoose.Schema.Types.ObjectId, ref: "LifeFinancePlan", default: null },
  source: { type: SourceSchema, default: () => ({}) },
  dedupeKey: { type: String, default: undefined, maxlength: 240 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

LifeFinanceEntrySchema.index({ user: 1, localDate: 1, type: 1 });
LifeFinanceEntrySchema.index({ user: 1, occurredAt: -1 });
LifeFinanceEntrySchema.index(
  { user: 1, "source.provider": 1, "source.externalId": 1 },
  { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } } }
);
LifeFinanceEntrySchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model("LifeFinanceEntry", LifeFinanceEntrySchema);
