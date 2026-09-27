const mongoose = require("mongoose");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const CourseContributionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, immutable: true },
  qualifiedUnits: { type: Number, required: true, min: 0, immutable: true },
}, { _id: false });

const CreatorEarningPeriodSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true, immutable: true },
  sourceCalculationId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorPoolCalculation", default: null, immutable: true },
  sourceInputHash: { type: String, default: null, minlength: 64, maxlength: 64, immutable: true },
  periodStart: { type: Date, required: true, immutable: true },
  periodEnd: { type: Date, required: true, immutable: true },
  policyVersion: { type: Number, required: true, min: 1, immutable: true },
  qualifiedPoints: { type: Number, default: 0, min: 0 },
  qualifiedUnits: {
    type: Number,
    default: null,
    min: 0,
    immutable: true,
    validate: { validator: (value) => value === null || Number.isSafeInteger(value), message: "Qualified units must be a safe integer." },
  },
  status: { type: String, enum: ["estimated", "finalizing", "pending", "finalized", "available", "payable", "paid", "adjusted"], default: "estimated", index: true },
  currency: currencyField({ required: false, defaultValue: null, immutable: true }),
  premiumRevenueMinor: minorUnitField({ defaultValue: null, immutable: true }),
  creatorPoolMinor: minorUnitField({ defaultValue: null, immutable: true }),
  estimatedAmountMinor: minorUnitField({ defaultValue: null, immutable: true }),
  finalizedAmountMinor: minorUnitField({ defaultValue: null, immutable: true }),
  courseContributions: { type: [CourseContributionSchema], default: [], immutable: true },
  finalizedAt: { type: Date, default: null, immutable: true },
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
}, { timestamps: true });

CreatorEarningPeriodSchema.pre("validate", function validateEarningPeriod(next) {
  if (this.periodEnd <= this.periodStart) return next(new Error("Creator earning period must have a positive duration."));
  return next();
});

CreatorEarningPeriodSchema.index(
  { creatorId: 1, periodStart: 1, periodEnd: 1, currency: 1 },
  { unique: true, partialFilterExpression: { currency: { $type: "string" } }, name: "creator_earning_period_currency_unique" }
);
CreatorEarningPeriodSchema.index(
  { creatorId: 1, sourceCalculationId: 1 },
  { unique: true, partialFilterExpression: { sourceCalculationId: { $type: "objectId" } }, name: "creator_earning_source_unique" }
);
CreatorEarningPeriodSchema.index({ status: 1, periodEnd: -1, currency: 1 }, { name: "creator_earning_admin_report" });

module.exports = mongoose.model("CreatorEarningPeriod", CreatorEarningPeriodSchema);
