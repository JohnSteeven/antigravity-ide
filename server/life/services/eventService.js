const crypto = require("crypto");
const LifeEvent = require("../models/LifeEvent");
const LifeGoal = require("../models/LifeGoal");
const LifeHabit = require("../models/LifeHabit");
const LifeMedication = require("../models/LifeMedication");
const LifeRoutine = require("../models/LifeRoutine");
const LifeTask = require("../models/LifeTask");
const { LIFE_EVENT_STATUSES } = require("../domain/constants");
const { LifeError, notFound } = require("../domain/errors");
const { assertDateKey, localDateKey, zonedDateTimeToUtc } = require("../domain/time");
const profileService = require("./profileService");

const OWNER_MODELS = Object.freeze({
  habit: LifeHabit,
  task: LifeTask,
  routine: LifeRoutine,
  goal_action: LifeGoal,
  medication: LifeMedication,
});

const buildIdempotencyKey = (input) => {
  // Use the semantic occurrence/action as the server key. A client mutation ID is
  // useful for tracing, but two devices may legitimately send different IDs for
  // the same tap; those requests must still converge to one immutable event.
  return crypto.createHash("sha256").update(JSON.stringify({
    itemType: input.itemType,
    itemId: String(input.itemId),
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime || "",
    status: input.status,
    quantity: input.quantity ?? null,
    durationMinutes: input.durationMinutes ?? null,
    snoozedUntil: input.snoozedUntil || null,
    routineSteps: Array.isArray(input.routineSteps) ? input.routineSteps.map((step) => ({ stepId: String(step.stepId || ""), title: step.title, status: step.status })) : [],
  })).digest("hex");
};

const assertOwnedItem = async (userId, itemType, itemId) => {
  const Model = OWNER_MODELS[itemType];
  if (!Model) throw new LifeError("This Life item cannot use completion actions yet.", 422, "LIFE_ITEM_TYPE");
  const item = await Model.findOne({ _id: itemId, user: userId });
  if (!item) throw notFound("Life item");
  return item;
};

const logEvent = async (userId, itemType, itemId, input = {}) => {
  const normalizedType = String(itemType || "").toLowerCase();
  const item = await assertOwnedItem(userId, normalizedType, itemId);
  const status = String(input.status || "completed").toLowerCase();
  if (!LIFE_EVENT_STATUSES.includes(status)) throw new LifeError("Choose complete, partial, skip, missed, or snooze.", 422, "LIFE_EVENT_STATUS");
  const profile = await profileService.getOrCreateProfile(userId);
  const currentLocalDate = localDateKey(new Date(), profile.timezone);
  const scheduledDate = assertDateKey(input.scheduledDate || item.localDate || currentLocalDate);
  const preferredTime = input.scheduledTime || item.schedule?.times?.[0] || "12:00";
  const [hour, minute] = /^([01]\d|2[0-3]):[0-5]\d$/.test(preferredTime) ? preferredTime.split(":").map(Number) : [12, 0];
  const scheduledFor = input.scheduledFor
    ? new Date(input.scheduledFor)
    : zonedDateTimeToUtc({ dateKey: scheduledDate, hour, minute }, profile.timezone);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const idempotencyKey = buildIdempotencyKey({ ...input, itemType: normalizedType, itemId, scheduledDate, status });
  const existing = await LifeEvent.findOne({ user: userId, idempotencyKey });
  if (existing) return { event: existing, duplicate: true };

  const occurrenceKey = input.scheduledTime || "all-day";
  const latest = await LifeEvent.findOne({ user: userId, itemType: normalizedType, itemId, scheduledDate, occurrenceKey }).sort({ occurredAt: -1, createdAt: -1 });
  const payload = {
    user: userId,
    itemType: normalizedType,
    itemId,
    scheduledDate,
    scheduledTime: input.scheduledTime || "",
    occurrenceKey,
    scheduledFor,
    occurredAt,
    status,
    quantity: input.quantity ?? null,
    unit: input.unit || item.unit || "",
    durationMinutes: input.durationMinutes ?? null,
    note: input.note || "",
    source: input.source || "manual",
    sourceProvider: input.sourceProvider || "",
    externalId: input.externalId || "",
    idempotencyKey,
    supersedes: latest?._id || null,
    backfilled: scheduledDate < currentLocalDate || Boolean(input.backfilled),
    snoozedUntil: status === "snoozed" && input.snoozedUntil ? new Date(input.snoozedUntil) : null,
    routineSteps: normalizedType === "routine" && Array.isArray(input.routineSteps) ? input.routineSteps.slice(0, 100) : [],
  };
  if (status === "snoozed" && (!payload.snoozedUntil || payload.snoozedUntil <= occurredAt)) {
    throw new LifeError("Choose a snooze time in the future.", 422, "LIFE_SNOOZE_TIME");
  }
  try {
    return { event: await LifeEvent.create(payload), duplicate: false };
  } catch (error) {
    if (error.code === 11000) {
      return { event: await LifeEvent.findOne({ user: userId, idempotencyKey }), duplicate: true };
    }
    throw error;
  }
};

const latestEventsForDate = async (userId, scheduledDate) => {
  const rows = await LifeEvent.find({ user: userId, scheduledDate }).sort({ occurredAt: 1, createdAt: 1 }).lean();
  return rows.reduce((map, event) => map.set(`${event.itemType}:${event.itemId}:${event.occurrenceKey || "all-day"}`, event), new Map());
};

module.exports = { assertOwnedItem, buildIdempotencyKey, latestEventsForDate, logEvent };
