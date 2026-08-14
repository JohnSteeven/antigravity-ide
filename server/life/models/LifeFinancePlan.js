const mongoose = require("mongoose");
const { FINANCE_PLAN_TYPES } = require("../domain/constants");
const { ReminderSchema, ScheduleSchema } = require("./shared");

const LifeFinancePlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: FINANCE_PLAN_TYPES, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  amountMinor: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  category: { type: String, default: "", maxlength: 80 },
  period: { type: String, enum: ["weekly", "monthly", "custom", "recurring"], default: "monthly" },
  periodStart: { type: String, default: null },
  periodEnd: { type: String, default: null },
  schedule: { type: ScheduleSchema, default: null },
  reminder: { type: ReminderSchema, default: () => ({}) },
  currentAmountMinor: { type: Number, default: 0, min: 0 },
  dueDate: { type: String, default: null },
  status: { type: String, enum: ["active", "paused", "completed", "cancelled", "archived"], default: "active", index: true },
  notes: { type: String, default: "", maxlength: 2000 },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

LifeFinancePlanSchema.index({ user: 1, type: 1, status: 1 });
LifeFinancePlanSchema.index({ user: 1, status: 1, dueDate: 1 });
module.exports = mongoose.model("LifeFinancePlan", LifeFinancePlanSchema);
