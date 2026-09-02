const mongoose = require("mongoose");
const { ReminderSchema, ScheduleSchema } = require("./shared");

const LifeMedicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  doseText: { type: String, default: "", maxlength: 160 },
  notes: { type: String, default: "", maxlength: 2000 },
  schedule: { type: ScheduleSchema, required: true },
  reminder: { type: ReminderSchema, default: () => ({}) },
  status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
  currentScheduleVersion: { type: Number, default: 1, min: 1 },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

LifeMedicationSchema.index({ user: 1, status: 1 });
module.exports = mongoose.model("LifeMedication", LifeMedicationSchema);
