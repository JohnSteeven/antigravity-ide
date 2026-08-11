const LifeProfile = require("../models/LifeProfile");
const { DEFAULT_VISIBLE_MODULES } = require("../domain/constants");
const { assertTimeZone } = require("../domain/time");

const ALLOWED_MODULES = new Set(["habits", "goals", "water", "sleep", "workouts", "mood", "money", "journal", "tasks", "routines"]);

const getOrCreateProfile = async (userId) => LifeProfile.findOneAndUpdate(
  { user: userId },
  { $setOnInsert: { user: userId } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

const sanitizeProfileUpdates = (input = {}) => {
  const updates = {};
  if (input.timezone !== undefined) updates.timezone = assertTimeZone(input.timezone);
  if (["monday", "sunday"].includes(input.weekStart)) updates.weekStart = input.weekStart;
  if (["metric", "imperial"].includes(input.unitSystem)) updates.unitSystem = input.unitSystem;
  if (["ml", "l", "oz"].includes(input.waterUnit)) updates.waterUnit = input.waterUnit;
  if (["kg", "lb"].includes(input.weightUnit)) updates.weightUnit = input.weightUnit;
  if (["km", "miles"].includes(input.distanceUnit)) updates.distanceUnit = input.distanceUnit;
  if (input.locale !== undefined) updates.locale = String(input.locale || "en").slice(0, 20);
  if (input.currency !== undefined && /^[A-Za-z]{3}$/.test(input.currency)) updates.currency = input.currency.toUpperCase();
  if (input.waterTargetMl !== undefined) updates.waterTargetMl = input.waterTargetMl === null ? null : Math.max(0, Number(input.waterTargetMl));
  if (input.sleepTargetMinutes !== undefined) updates.sleepTargetMinutes = input.sleepTargetMinutes === null ? null : Math.max(0, Math.min(1440, Number(input.sleepTargetMinutes)));
  if (Array.isArray(input.visibleModules)) {
    updates.visibleModules = [...new Set(input.visibleModules.filter((module) => ALLOWED_MODULES.has(module)))];
    if (!updates.visibleModules.length) updates.visibleModules = [...DEFAULT_VISIBLE_MODULES];
  }
  if (typeof input.aiInsightsEnabled === "boolean") updates.aiInsightsEnabled = input.aiInsightsEnabled;
  if (input.notifications && typeof input.notifications === "object") {
    if (typeof input.notifications.enabled === "boolean") updates["notifications.enabled"] = input.notifications.enabled;
    if (Array.isArray(input.notifications.channels)) {
      updates["notifications.channels"] = input.notifications.channels.filter((channel) => ["in_app", "email", "web_push"].includes(channel));
    }
    if (typeof input.notifications.morningBrief === "boolean") updates["notifications.morningBrief"] = input.notifications.morningBrief;
    if (typeof input.notifications.eveningSummary === "boolean") updates["notifications.eveningSummary"] = input.notifications.eveningSummary;
    if (Number.isFinite(Number(input.notifications.dailyCap))) updates["notifications.dailyCap"] = Math.max(0, Math.min(50, Number(input.notifications.dailyCap)));
    if (input.notifications.quietHours && typeof input.notifications.quietHours === "object") {
      const quiet = input.notifications.quietHours;
      if (typeof quiet.enabled === "boolean") updates["notifications.quietHours.enabled"] = quiet.enabled;
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.start || "")) updates["notifications.quietHours.start"] = quiet.start;
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.end || "")) updates["notifications.quietHours.end"] = quiet.end;
    }
  }
  if (input.vacationMode && typeof input.vacationMode === "object") {
    if (typeof input.vacationMode.enabled === "boolean") updates["vacationMode.enabled"] = input.vacationMode.enabled;
    if (input.vacationMode.startDate !== undefined) updates["vacationMode.startDate"] = input.vacationMode.startDate || null;
    if (input.vacationMode.endDate !== undefined) updates["vacationMode.endDate"] = input.vacationMode.endDate || null;
  }
  return updates;
};

const updateProfile = async (userId, input = {}) => LifeProfile.findOneAndUpdate(
  { user: userId },
  { $set: sanitizeProfileUpdates(input), $setOnInsert: { user: userId } },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const completeOnboarding = async (userId, input = {}) => {
  const updates = sanitizeProfileUpdates(input);
  updates["onboarding.completedAt"] = new Date();
  updates["onboarding.skippedAt"] = null;
  if (Array.isArray(input.priorities)) updates["onboarding.priorities"] = input.priorities.map(String).slice(0, 5);
  return LifeProfile.findOneAndUpdate(
    { user: userId },
    { $set: updates, $setOnInsert: { user: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const skipOnboarding = async (userId, input = {}) => {
  const updates = sanitizeProfileUpdates(input);
  updates["onboarding.completedAt"] = null;
  updates["onboarding.skippedAt"] = new Date();
  return LifeProfile.findOneAndUpdate(
    { user: userId },
    { $set: updates, $setOnInsert: { user: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

module.exports = { completeOnboarding, getOrCreateProfile, sanitizeProfileUpdates, skipOnboarding, updateProfile };
