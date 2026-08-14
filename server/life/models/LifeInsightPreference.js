const mongoose = require("mongoose");

const LifeInsightPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true, maxlength: 80 },
  hidden: { type: Boolean, default: false },
  usefulCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

LifeInsightPreferenceSchema.index({ user: 1, type: 1 }, { unique: true });
module.exports = mongoose.model("LifeInsightPreference", LifeInsightPreferenceSchema);
