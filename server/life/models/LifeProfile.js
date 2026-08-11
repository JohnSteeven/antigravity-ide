const mongoose = require("mongoose");
const { DEFAULT_LIFE_AREAS, DEFAULT_VISIBLE_MODULES } = require("../domain/constants");

const LifeAreaSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  color: { type: String, default: "teal", maxlength: 30 },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

const LifeProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  timezone: { type: String, default: "UTC" },
  locale: { type: String, default: "en" },
  weekStart: { type: String, enum: ["monday", "sunday"], default: "monday" },
  unitSystem: { type: String, enum: ["metric", "imperial"], default: "metric" },
  waterUnit: { type: String, enum: ["ml", "l", "oz"], default: "ml" },
  weightUnit: { type: String, enum: ["kg", "lb"], default: "kg" },
  distanceUnit: { type: String, enum: ["km", "miles"], default: "km" },
  currency: { type: String, default: "USD", uppercase: true, minlength: 3, maxlength: 3 },
  waterTargetMl: { type: Number, default: null, min: 0 },
  sleepTargetMinutes: { type: Number, default: null, min: 0, max: 1440 },
  visibleModules: { type: [String], default: () => [...DEFAULT_VISIBLE_MODULES] },
  areas: { type: [LifeAreaSchema], default: () => DEFAULT_LIFE_AREAS.map((name, order) => ({ name, order })) },
  onboarding: {
    completedAt: { type: Date, default: null },
    skippedAt: { type: Date, default: null },
    priorities: { type: [String], default: [] },
  },
  notifications: {
    enabled: { type: Boolean, default: true },
    channels: { type: [String], default: ["in_app"] },
    quietHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: "22:00" },
      end: { type: String, default: "07:00" },
    },
    dailyCap: { type: Number, default: 8, min: 0, max: 50 },
    morningBrief: { type: Boolean, default: false },
    eveningSummary: { type: Boolean, default: false },
  },
  aiInsightsEnabled: { type: Boolean, default: false },
  vacationMode: {
    enabled: { type: Boolean, default: false },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
  },
  retention: {
    policy: { type: String, enum: ["account_lifetime", "custom"], default: "account_lifetime" },
    customDays: { type: Number, default: null, min: 30 },
  },
}, { timestamps: true });

module.exports = mongoose.model("LifeProfile", LifeProfileSchema);
