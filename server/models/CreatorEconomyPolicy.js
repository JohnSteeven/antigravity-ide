const mongoose = require("mongoose");

const CreatorEconomyPolicySchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true, immutable: true },
  active: { type: Boolean, default: false },
  version: { type: Number, default: 1, min: 1 },
  creatorPoolRate: { type: Number, default: null, min: 0, max: 1 },
  creatorPoolBasisPoints: { type: Number, default: null, min: 0, max: 10000 },
  revenueBasis: { type: String, enum: ["captured_less_refunds_chargebacks"], default: "captured_less_refunds_chargebacks" },
  learningWeights: {
    lessonCompletion: { type: Number, default: 1, min: 0 },
    quizPass: { type: Number, default: 1, min: 0 },
    exercisePass: { type: Number, default: 1, min: 0 },
    courseCompletion: { type: Number, default: 4, min: 0 },
    repeatMeaningfulLearnerDay: { type: Number, default: 1, min: 0 },
  },
  weights: {
    qualifiedRead: { type: Number, default: 1, min: 0 },
    qualifiedWatchMinute: { type: Number, default: 1, min: 0 },
    qualifiedListenMinute: { type: Number, default: 1, min: 0 },
    lessonCompletion: { type: Number, default: 2, min: 0 },
    courseProgression: { type: Number, default: 3, min: 0 },
    meaningfulSave: { type: Number, default: 0.5, min: 0 },
  },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  changeReason: { type: String, default: "", maxlength: 1000 },
}, { timestamps: true });

CreatorEconomyPolicySchema.pre("validate", function validatePoolPolicy(next) {
  if (this.creatorPoolBasisPoints !== null && !Number.isSafeInteger(this.creatorPoolBasisPoints)) {
    return next(new Error("Creator pool basis points must be an integer."));
  }
  const values = Object.values(this.learningWeights?.toObject?.() || this.learningWeights || {});
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) {
    return next(new Error("Creator learning weights must be non-negative integers."));
  }
  return next();
});

module.exports = mongoose.model("CreatorEconomyPolicy", CreatorEconomyPolicySchema);
