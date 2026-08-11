const mongoose = require("mongoose");
const { ReminderSchema, ScheduleSchema } = require("./shared");

const RoutineItemSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  order: { type: Number, default: 0 },
  linkedType: { type: String, enum: ["habit", "task", "routine_only"], default: "routine_only" },
  linkedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  optional: { type: Boolean, default: false },
}, { _id: true });

const LifeRoutineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  lifeAreaId: { type: String, default: "" },
  items: { type: [RoutineItemSchema], default: [] },
  schedule: { type: ScheduleSchema, required: true },
  reminder: { type: ReminderSchema, default: () => ({}) },
  status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
  currentScheduleVersion: { type: Number, default: 1 },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

LifeRoutineSchema.index({ user: 1, status: 1 });
module.exports = mongoose.model("LifeRoutine", LifeRoutineSchema);
