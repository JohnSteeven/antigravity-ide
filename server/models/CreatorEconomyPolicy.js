const mongoose = require("mongoose");

const CreatorEconomyPolicySchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true, immutable: true },
  active: { type: Boolean, default: false },
  version: { type: Number, default: 1, min: 1 },
  creatorPoolRate: { type: Number, default: null, min: 0, max: 1 },
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

module.exports = mongoose.model("CreatorEconomyPolicy", CreatorEconomyPolicySchema);
