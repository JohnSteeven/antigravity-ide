const LifeHabit = require("../models/LifeHabit");
const LifeGoal = require("../models/LifeGoal");
const LifeScheduleVersion = require("../models/LifeScheduleVersion");
const { HABIT_INTENTS, HABIT_MEASUREMENT_TYPES } = require("../domain/constants");
const { normalizeSchedule } = require("../domain/recurrence");
const { addLocalDays, assertDateKey, localDateKey } = require("../domain/time");
const { conflict, notFound, LifeError } = require("../domain/errors");
const profileService = require("./profileService");

const HABIT_FIELDS = [
  "name", "why", "lifeAreaId", "target", "unit", "preferredPeriod", "gracePeriodMinutes",
  "difficulty", "notes", "linkedGoal", "replacementBehavior", "reminder",
];

const sanitizeHabit = (input = {}, { creating = false } = {}) => {
  const data = {};
  HABIT_FIELDS.forEach((field) => {
    if (input[field] !== undefined) data[field] = input[field];
  });
  if (input.linkedGoal !== undefined) data.linkedGoal = input.linkedGoal || null;
  if (input.intent !== undefined && HABIT_INTENTS.includes(String(input.intent).toLowerCase())) data.intent = String(input.intent).toLowerCase();
  if (input.measurementType !== undefined && HABIT_MEASUREMENT_TYPES.includes(String(input.measurementType).toLowerCase())) data.measurementType = String(input.measurementType).toLowerCase();
  if (input.schedule !== undefined || creating) data.schedule = normalizeSchedule(input.schedule || {});
  return data;
};

const assertLinkedGoal = async (userId, linkedGoal) => {
  if (!linkedGoal) return null;
  const goal = await LifeGoal.findOne({ _id: linkedGoal, user: userId });
  if (!goal) throw notFound("Linked goal");
  return goal;
};

const syncGoalLink = async (userId, habitId, previousGoal, nextGoal) => {
  if (String(previousGoal || "") === String(nextGoal || "")) return;
  if (previousGoal) await LifeGoal.updateOne({ _id: previousGoal, user: userId }, { $pull: { linkedHabits: habitId } });
  if (nextGoal) await LifeGoal.updateOne({ _id: nextGoal, user: userId }, { $addToSet: { linkedHabits: habitId } });
};

const createHabit = async (userId, input = {}) => {
  if (!String(input.name || "").trim()) throw new LifeError("Give this habit a name.", 422, "LIFE_VALIDATION");
  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);
  const data = sanitizeHabit({ ...input, schedule: { ...(input.schedule || {}), startDate: input.schedule?.startDate || today } }, { creating: true });
  await assertLinkedGoal(userId, data.linkedGoal);
  const habit = await LifeHabit.create({ user: userId, ...data });
  try {
    await LifeScheduleVersion.create({
      user: userId,
      itemType: "habit",
      itemId: habit._id,
      version: 1,
      effectiveFrom: data.schedule.startDate,
      timezone: profile.timezone,
      schedule: data.schedule,
      definitionSnapshot: { name: habit.name, measurementType: habit.measurementType, target: habit.target, unit: habit.unit },
    });
  } catch (error) {
    await LifeHabit.deleteOne({ _id: habit._id, user: userId });
    throw error;
  }
  await syncGoalLink(userId, habit._id, null, habit.linkedGoal);
  return habit;
};

const listHabits = async (userId, { status = "active", page = 1, limit = 50 } = {}) => {
  const filter = { user: userId };
  if (status !== "all") filter.status = status;
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const safePage = Math.max(1, Number(page) || 1);
  const [items, total] = await Promise.all([
    LifeHabit.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    LifeHabit.countDocuments(filter),
  ]);
  return { items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

const getHabit = async (userId, habitId) => {
  const habit = await LifeHabit.findOne({ _id: habitId, user: userId });
  if (!habit) throw notFound("Habit");
  return habit;
};

const updateHabit = async (userId, habitId, input = {}) => {
  const habit = await getHabit(userId, habitId);
  const updates = sanitizeHabit(input);
  if (updates.linkedGoal !== undefined) await assertLinkedGoal(userId, updates.linkedGoal);
  const previousGoal = habit.linkedGoal;
  if (!input.schedule) {
    Object.assign(habit, updates);
    await habit.save();
    await syncGoalLink(userId, habit._id, previousGoal, habit.linkedGoal);
    return habit;
  }

  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);
  const editScope = input.editScope || "future";
  const effectiveDate = assertDateKey(input.effectiveDate || today);
  if (editScope === "historical_correction") {
    if (!input.correctionReason || !input.scheduleVersion) {
      throw new LifeError("Historical corrections require a schedule version and reason.", 422, "LIFE_CORRECTION_REQUIRED");
    }
    const corrected = await LifeScheduleVersion.findOneAndUpdate(
      { user: userId, itemType: "habit", itemId: habitId, version: Number(input.scheduleVersion) },
      { $set: { schedule: updates.schedule, correctedAt: new Date(), correctionReason: String(input.correctionReason).slice(0, 500) } },
      { new: true, runValidators: true }
    );
    if (!corrected) throw notFound("Schedule version");
    if (corrected.version === habit.currentScheduleVersion) {
      Object.assign(habit, updates);
      await habit.save();
    }
    return habit;
  }
  if (editScope !== "future") throw new LifeError("Choose future changes or an explicit historical correction.", 422, "LIFE_EDIT_SCOPE");
  if (effectiveDate < today) throw new LifeError("Future schedule changes cannot begin in the past.", 422, "LIFE_EFFECTIVE_DATE");

  const nextVersion = habit.currentScheduleVersion + 1;
  try {
    await LifeScheduleVersion.create({
      user: userId,
      itemType: "habit",
      itemId: habit._id,
      version: nextVersion,
      effectiveFrom: effectiveDate,
      timezone: profile.timezone,
      schedule: updates.schedule,
      definitionSnapshot: {
        name: updates.name || habit.name,
        measurementType: updates.measurementType || habit.measurementType,
        target: updates.target ?? habit.target,
        unit: updates.unit || habit.unit,
      },
    });
  } catch (error) {
    if (error.code === 11000) throw conflict("This habit changed on another device. Refresh and try again.");
    throw error;
  }

  const updated = await LifeHabit.findOneAndUpdate(
    { _id: habit._id, user: userId, currentScheduleVersion: habit.currentScheduleVersion },
    { $set: { ...updates, currentScheduleVersion: nextVersion } },
    { new: true, runValidators: true }
  );
  if (!updated) {
    await LifeScheduleVersion.deleteOne({ user: userId, itemId: habit._id, version: nextVersion });
    throw conflict("This habit changed on another device. Refresh and try again.");
  }
  await LifeScheduleVersion.updateOne(
    { user: userId, itemId: habit._id, version: habit.currentScheduleVersion },
    { $set: { effectiveTo: addLocalDays(effectiveDate, -1) } }
  );
  await syncGoalLink(userId, habit._id, previousGoal, updated.linkedGoal);
  return updated;
};

const setHabitStatus = async (userId, habitId, status) => {
  if (!["active", "paused", "archived"].includes(status)) throw new LifeError("Choose active, paused, or archived.", 422);
  const habit = await LifeHabit.findOneAndUpdate(
    { _id: habitId, user: userId },
    { $set: { status, archivedAt: status === "archived" ? new Date() : null } },
    { new: true }
  );
  if (!habit) throw notFound("Habit");
  return habit;
};

module.exports = { createHabit, getHabit, listHabits, sanitizeHabit, setHabitStatus, updateHabit };
