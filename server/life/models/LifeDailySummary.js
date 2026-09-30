const mongoose = require("mongoose");

const CurrencyAmountSchema = new mongoose.Schema({
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  amountMinor: { type: Number, required: true, min: 0 },
}, { _id: false });

const LifeSignalsSchema = new mongoose.Schema({
  sleep: { type: Number, default: null, min: 0, max: 100 },
  activity: { type: Number, default: null, min: 0, max: 100 },
  consistency: { type: Number, default: null, min: 0, max: 100 },
  mind: { type: Number, default: null, min: 0, max: 100 },
  goals: { type: Number, default: null, min: 0, max: 100 },
}, { _id: false });

const LifeDailySummarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  localDate: { type: String, required: true, index: true },
  timezone: { type: String, default: "UTC" },
  habitsPlanned: { type: Number, default: 0, min: 0 },
  habitsCompleted: { type: Number, default: 0, min: 0 },
  habitsPartial: { type: Number, default: 0, min: 0 },
  habitsSkipped: { type: Number, default: 0, min: 0 },
  tasksCompleted: { type: Number, default: 0, min: 0 },
  waterMl: { type: Number, default: 0, min: 0 },
  sleepMinutes: { type: Number, default: 0, min: 0 },
  sleepQuality: { type: Number, default: null, min: 1, max: 5 },
  workoutMinutes: { type: Number, default: 0, min: 0 },
  activeCalories: { type: Number, default: 0, min: 0 },
  caloriesConsumed: { type: Number, default: 0, min: 0 },
  proteinGrams: { type: Number, default: 0, min: 0 },
  carbsGrams: { type: Number, default: 0, min: 0 },
  fatGrams: { type: Number, default: 0, min: 0 },
  moodScore: { type: Number, default: null, min: 1, max: 5 },
  stressScore: { type: Number, default: null, min: 1, max: 5 },
  energyScore: { type: Number, default: null, min: 1, max: 5 },
  focusScore: { type: Number, default: null, min: 1, max: 5 },
  expensesByCurrency: { type: [CurrencyAmountSchema], default: [] },
  incomeByCurrency: { type: [CurrencyAmountSchema], default: [] },
  signals: { type: LifeSignalsSchema, default: () => ({}) },
  lastCalculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

LifeDailySummarySchema.index({ user: 1, localDate: 1 }, { unique: true });
LifeDailySummarySchema.index({ user: 1, localDate: -1 });

module.exports = mongoose.model("LifeDailySummary", LifeDailySummarySchema);
