const mongoose = require("mongoose");
const { ScheduleSchema } = require("./shared");

const LifeScheduleVersionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  itemType: { type: String, enum: ["habit", "routine", "medication", "bill"], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  version: { type: Number, required: true, min: 1 },
  effectiveFrom: { type: String, required: true },
  effectiveTo: { type: String, default: null },
  timezone: { type: String, required: true },
  schedule: { type: ScheduleSchema, required: true },
  definitionSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  correctedAt: { type: Date, default: null },
  correctionReason: { type: String, default: "", maxlength: 500 },
}, { timestamps: true });

LifeScheduleVersionSchema.index({ user: 1, itemType: 1, itemId: 1, version: 1 }, { unique: true });
LifeScheduleVersionSchema.index({ user: 1, itemType: 1, effectiveFrom: 1, effectiveTo: 1 });
module.exports = mongoose.model("LifeScheduleVersion", LifeScheduleVersionSchema);
