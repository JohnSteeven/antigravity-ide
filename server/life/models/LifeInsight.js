const mongoose = require("mongoose");

const LifeInsightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true, maxlength: 80 },
  windowKey: { type: String, required: true, maxlength: 80 },
  kind: { type: String, enum: ["observation", "correlation", "suggestion"], default: "observation" },
  message: { type: String, required: true, maxlength: 600 },
  sourceMetrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  quality: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  generatedAt: { type: Date, default: Date.now },
  dismissedAt: { type: Date, default: null },
}, { timestamps: true });

LifeInsightSchema.index({ user: 1, type: 1, windowKey: 1 }, { unique: true });
module.exports = mongoose.model("LifeInsight", LifeInsightSchema);
