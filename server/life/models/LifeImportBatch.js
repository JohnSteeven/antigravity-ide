const mongoose = require("mongoose");

const ImportRowSchema = new mongoose.Schema({
  rowNumber: { type: Number, required: true },
  type: { type: String, enum: ["expense", "income", "savings_contribution"], required: true },
  amountMinor: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, minlength: 3, maxlength: 3 },
  localDate: { type: String, required: true },
  category: { type: String, default: "Other", maxlength: 80 },
  payee: { type: String, default: "", maxlength: 160 },
  note: { type: String, default: "", maxlength: 2000 },
  externalId: { type: String, required: true, maxlength: 200 },
  duplicate: { type: Boolean, default: false },
}, { _id: false });

const InvalidRowSchema = new mongoose.Schema({
  rowNumber: Number,
  reason: { type: String, maxlength: 240 },
}, { _id: false });

const LifeImportBatchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  kind: { type: String, enum: ["finance_csv"], required: true },
  status: { type: String, enum: ["preview", "importing", "imported", "expired"], default: "preview", index: true },
  rows: { type: [ImportRowSchema], default: [] },
  invalidRows: { type: [InvalidRowSchema], default: [] },
  importedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

LifeImportBatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
LifeImportBatchSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("LifeImportBatch", LifeImportBatchSchema);
