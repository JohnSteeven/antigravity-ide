const mongoose = require("mongoose");

const ACCOUNT_TYPES = ["bank", "credit_card", "cash", "wallet", "savings", "investment", "other"];

const LifeFinanceAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ACCOUNT_TYPES, default: "bank" },
  balanceMinor: { type: Number, default: 0 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  institution: { type: String, default: "", maxlength: 120 },
  isArchived: { type: Boolean, default: false },
  notes: { type: String, default: "", maxlength: 1000 },
}, { timestamps: true });

LifeFinanceAccountSchema.index({ user: 1, isArchived: 1 });
LifeFinanceAccountSchema.index({ user: 1, currency: 1 });

module.exports = mongoose.model("LifeFinanceAccount", LifeFinanceAccountSchema);
