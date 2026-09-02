const mongoose = require("mongoose");
const { GOAL_PROGRESS_STRATEGIES, GOAL_STATUSES } = require("../domain/constants");

const GoalMilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 160 },
  targetDate: { type: String, default: null },
  completedAt: { type: Date, default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const LifeGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  why: { type: String, default: "", maxlength: 1000 },
  lifeAreaId: { type: String, default: "" },
  startDate: { type: String, required: true },
  targetDate: { type: String, default: null },
  progressStrategy: { type: String, enum: GOAL_PROGRESS_STRATEGIES, default: "manual" },
  manualProgress: { type: Number, default: 0, min: 0, max: 100 },
  currentValue: { type: Number, default: 0 },
  targetValue: { type: Number, default: null },
  unit: { type: String, default: "", maxlength: 40 },
  milestones: { type: [GoalMilestoneSchema], default: [] },
  linkedHabits: [{ type: mongoose.Schema.Types.ObjectId, ref: "LifeHabit" }],
  notes: { type: String, default: "", maxlength: 3000 },
  status: { type: String, enum: GOAL_STATUSES, default: "active", index: true },
  completedAt: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

LifeGoalSchema.index({ user: 1, status: 1, targetDate: 1 });
module.exports = mongoose.model("LifeGoal", LifeGoalSchema);
