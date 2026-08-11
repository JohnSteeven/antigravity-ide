const mongoose = require("mongoose");

const LifeTaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  localDate: { type: String, required: true, index: true },
  scheduledFor: { type: Date, default: null },
  period: { type: String, enum: ["all_day", "morning", "afternoon", "evening"], default: "all_day" },
  priority: { type: String, enum: ["none", "low", "medium", "high"], default: "none" },
  linkedGoal: { type: mongoose.Schema.Types.ObjectId, ref: "LifeGoal", default: null },
  lifeAreaId: { type: String, default: "" },
  durationEstimateMinutes: { type: Number, default: null, min: 0, max: 1440 },
  notes: { type: String, default: "", maxlength: 2000 },
  status: { type: String, enum: ["active", "archived"], default: "active" },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

LifeTaskSchema.index({ user: 1, localDate: 1, status: 1 });
module.exports = mongoose.model("LifeTask", LifeTaskSchema);
