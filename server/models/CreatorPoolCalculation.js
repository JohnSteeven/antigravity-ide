const mongoose = require("mongoose");
const { currencyField, minorUnitField } = require("../billing/modelFields");

const CourseContributionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, immutable: true },
  qualifiedUnits: { type: Number, required: true, min: 0, immutable: true },
}, { _id: false });

const CreatorAllocationSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, immutable: true },
  qualifiedUnits: { type: Number, required: true, min: 0, immutable: true },
  amountMinor: minorUnitField({ required: true, immutable: true }),
  courseContributions: { type: [CourseContributionSchema], default: [], immutable: true },
}, { _id: false });

const CreatorPoolCalculationSchema = new mongoose.Schema({
  periodStart: { type: Date, required: true, immutable: true },
  periodEnd: { type: Date, required: true, immutable: true },
  currency: currencyField({ immutable: true }),
  policyVersion: { type: Number, required: true, min: 1, immutable: true },
  policySnapshot: {
    creatorPoolBasisPoints: { type: Number, required: true, min: 0, max: 10000, immutable: true },
    revenueBasis: { type: String, required: true, enum: ["captured_less_refunds_chargebacks"], immutable: true },
    learningWeights: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  },
  grossCapturedMinor: minorUnitField({ required: true, immutable: true }),
  refundedMinor: minorUnitField({ required: true, immutable: true }),
  chargebackMinor: minorUnitField({ required: true, immutable: true }),
  excludedFailedMinor: minorUnitField({ required: true, immutable: true }),
  excludedUncapturedMinor: minorUnitField({ required: true, immutable: true }),
  eligibleRevenueMinor: minorUnitField({ required: true, immutable: true }),
  creatorPoolMinor: minorUnitField({ required: true, immutable: true }),
  totalQualifiedUnits: { type: Number, required: true, min: 0, immutable: true },
  allocatedMinor: minorUnitField({ required: true, immutable: true }),
  unallocatedMinor: minorUnitField({ required: true, immutable: true }),
  allocations: { type: [CreatorAllocationSchema], default: [], immutable: true },
  inputHash: { type: String, required: true, immutable: true, minlength: 64, maxlength: 64 },
  status: { type: String, enum: ["calculated", "finalized"], default: "calculated", index: true },
  calculatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  finalizedAt: { type: Date, default: null },
}, { timestamps: true });

CreatorPoolCalculationSchema.pre("validate", function validateCalculation(next) {
  if (this.periodEnd <= this.periodStart) return next(new Error("Pool calculation period must have a positive duration."));
  if (!Number.isSafeInteger(this.totalQualifiedUnits)) return next(new Error("Qualified units must be a safe integer."));
  if (this.allocatedMinor > this.creatorPoolMinor || this.allocatedMinor + this.unallocatedMinor !== this.creatorPoolMinor) {
    return next(new Error("Creator allocations must reconcile exactly to the pool."));
  }
  const allocationTotal = (this.allocations || []).reduce((sum, allocation) => sum + allocation.amountMinor, 0);
  if (!Number.isSafeInteger(allocationTotal) || allocationTotal !== this.allocatedMinor) {
    return next(new Error("Creator allocation rows must reconcile to allocated minor units."));
  }
  return next();
});

CreatorPoolCalculationSchema.index(
  { periodStart: 1, periodEnd: 1, currency: 1, policyVersion: 1 },
  { unique: true, name: "creator_pool_period_currency_policy_unique" }
);
CreatorPoolCalculationSchema.index({ status: 1, periodEnd: -1, currency: 1 }, { name: "creator_pool_status_period" });

module.exports = mongoose.model("CreatorPoolCalculation", CreatorPoolCalculationSchema);
