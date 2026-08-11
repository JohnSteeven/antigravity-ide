const LifeMedication = require("../models/LifeMedication");
const LifeScheduleVersion = require("../models/LifeScheduleVersion");
const { normalizeSchedule } = require("../domain/recurrence");
const { addLocalDays, assertDateKey, localDateKey } = require("../domain/time");
const { conflict, notFound, LifeError } = require("../domain/errors");
const profileService = require("./profileService");

const listMedications = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
  const filter = { user: userId, ...(query.status && query.status !== "all" ? { status: query.status } : { status: "active" }) };
  const [items, total] = await Promise.all([LifeMedication.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), LifeMedication.countDocuments(filter)]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const createMedication = async (userId, input = {}) => {
  if (!String(input.name || "").trim()) throw new LifeError("Enter the medication name exactly as you know it.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);
  const schedule = normalizeSchedule({ ...(input.schedule || {}), startDate: input.schedule?.startDate || today });
  const medication = await LifeMedication.create({ user: userId, name: input.name, doseText: input.doseText || "", notes: input.notes || "", schedule, reminder: input.reminder || {} });
  try {
    await LifeScheduleVersion.create({ user: userId, itemType: "medication", itemId: medication._id, version: 1, effectiveFrom: schedule.startDate, timezone: profile.timezone, schedule, definitionSnapshot: { name: medication.name, doseText: medication.doseText } });
  } catch (error) {
    await LifeMedication.deleteOne({ _id: medication._id, user: userId });
    throw error;
  }
  return medication;
};

const updateMedication = async (userId, medicationId, input = {}) => {
  const medication = await LifeMedication.findOne({ _id: medicationId, user: userId });
  if (!medication) throw notFound("Medication schedule");
  const updates = Object.fromEntries(["name", "doseText", "notes", "reminder", "status"].filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
  if (updates.status && !["active", "paused", "archived"].includes(updates.status)) throw new LifeError("Choose active, paused, or archived.", 422);
  if (!input.schedule) {
    Object.assign(medication, updates, { archivedAt: updates.status === "archived" ? new Date() : medication.archivedAt });
    await medication.save();
    return medication;
  }
  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);
  const effectiveDate = assertDateKey(input.effectiveDate || today);
  if (effectiveDate < today) throw new LifeError("Future medication schedule changes cannot begin in the past.", 422);
  const schedule = normalizeSchedule({ ...input.schedule, startDate: input.schedule.startDate || effectiveDate });
  const nextVersion = medication.currentScheduleVersion + 1;
  try {
    await LifeScheduleVersion.create({ user: userId, itemType: "medication", itemId: medication._id, version: nextVersion, effectiveFrom: effectiveDate, timezone: profile.timezone, schedule, definitionSnapshot: { name: updates.name || medication.name, doseText: updates.doseText ?? medication.doseText } });
  } catch (error) {
    if (error.code === 11000) throw conflict("This medication schedule changed on another device. Refresh and try again.");
    throw error;
  }
  const updated = await LifeMedication.findOneAndUpdate({ _id: medication._id, user: userId, currentScheduleVersion: medication.currentScheduleVersion }, { $set: { ...updates, schedule, currentScheduleVersion: nextVersion } }, { new: true, runValidators: true });
  if (!updated) {
    await LifeScheduleVersion.deleteOne({ user: userId, itemType: "medication", itemId: medication._id, version: nextVersion });
    throw conflict("This medication schedule changed on another device. Refresh and try again.");
  }
  await LifeScheduleVersion.updateOne({ user: userId, itemType: "medication", itemId: medication._id, version: medication.currentScheduleVersion }, { $set: { effectiveTo: addLocalDays(effectiveDate, -1) } });
  return updated;
};

module.exports = { createMedication, listMedications, updateMedication };
