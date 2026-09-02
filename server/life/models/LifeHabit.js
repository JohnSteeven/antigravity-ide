const mongoose = require("mongoose");
const { HABIT_INTENTS, HABIT_MEASUREMENT_TYPES } = require("../domain/constants");
const { ReminderSchema, ScheduleSchema } = require("./shared");

const LifeHabitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  why: { type: String, default: "", maxlength: 800 },
  lifeAreaId: { type: String, default: "" },
  intent: { type: String, enum: HABIT_INTENTS, default: "build" },
  measurementType: { type: String, enum: HABIT_MEASUREMENT_TYPES, default: "boolean" },
  target: { type: Number, default: 1 },
  unit: { type: String, default: "completion", maxlength: 40 },
  preferredPeriod: { type: String, enum: ["anytime", "morning", "afternoon", "evening"], default: "anytime" },
  schedule: { type: ScheduleSchema, required: true },
  reminder: { type: ReminderSchema, default: () => ({}) },
  gracePeriodMinutes: { type: Number, default: 60, min: 0, max: 10080 },
  difficulty: { type: String, enum: ["gentle", "moderate", "challenging"], default: "gentle" },
  notes: { type: String, default: "", maxlength: 2000 },
  linkedGoal: { type: mongoose.Schema.Types.ObjectId, ref: "LifeGoal", default: null },
  replacementBehavior: { type: String, default: "", maxlength: 400 },
  status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
  archivedAt: { type: Date, default: null },
  currentScheduleVersion: { type: Number, default: 1, min: 1 },
}, { timestamps: true });

LifeHabitSchema.index({ user: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model("LifeHabit", LifeHabitSchema);
