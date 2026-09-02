const Notification = require("../../models/Notification");
const LifeEvent = require("../models/LifeEvent");
const LifeHabit = require("../models/LifeHabit");
const LifeMedication = require("../models/LifeMedication");
const LifeRoutine = require("../models/LifeRoutine");
const LifeProfile = require("../models/LifeProfile");
const LifeNotificationDelivery = require("../models/LifeNotificationDelivery");
const LifeNotificationJob = require("../models/LifeNotificationJob");
const { addLocalDays, getZonedParts, localDateKey, zonedDateTimeToUtc, zonedDayRange } = require("../domain/time");
const { generateSchedule } = require("../domain/recurrence");
const profileService = require("../services/profileService");
const metrics = require("../services/observability");
const webPushService = require("../services/webPushService");
const todayService = require("../services/todayService");

class InAppDeliveryAdapter {
  async deliver(job) {
    const notification = await Notification.create({
      user: job.user,
      title: job.title,
      message: job.message,
      type: "reminder",
      status: "unread",
      source: "life",
      sourceId: job._id,
    });
    return { providerMessageId: String(notification._id) };
  }
}

const adapters = new Map([["in_app", new InAppDeliveryAdapter()], ["web_push", webPushService.adapter]]);
const registerAdapter = (channel, adapter) => adapters.set(channel, adapter);

const timeText = (parts) => `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
const isQuietTime = (time, quiet = {}) => {
  if (!quiet.enabled) return false;
  const start = quiet.start || "22:00";
  const end = quiet.end || "07:00";
  return start <= end ? time >= start && time < end : time >= start || time < end;
};

const quietEndInstant = (date, profile) => {
  const parts = getZonedParts(date, profile.timezone);
  const dateKey = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const quiet = profile.notifications.quietHours;
  const current = timeText(parts);
  const endDate = quiet.start > quiet.end && current >= quiet.start ? addLocalDays(dateKey, 1) : dateKey;
  const [hour, minute] = quiet.end.split(":").map(Number);
  return zonedDateTimeToUtc({ dateKey: endDate, hour, minute }, profile.timezone);
};

const scheduleItemReminders = async (userId, item, itemType, daysAhead = 14, fromDate = null) => {
  if (!item.reminder?.enabled || item.status !== "active") {
    await LifeNotificationJob.updateMany({ user: userId, itemType, itemId: item._id, state: { $in: ["pending", "retry"] } }, { $set: { state: "suppressed", suppressedReason: "schedule_inactive" } });
    return { scheduled: 0 };
  }
  const profile = await profileService.getOrCreateProfile(userId);
  if (!profile.notifications.enabled) return { scheduled: 0 };
  const preferenceKey = itemType === "habit" ? "habitReminders" : itemType === "medication" ? "medicationReminders" : null;
  if (preferenceKey && profile.notifications[preferenceKey] === false) return { scheduled: 0 };
  const start = fromDate || localDateKey(new Date(), profile.timezone);
  const end = addLocalDays(start, Math.max(0, Math.min(60, daysAhead)));
  const dates = generateSchedule(item.schedule, start, end, 93);
  const times = item.reminder.times?.length ? item.reminder.times : item.schedule.times?.length ? item.schedule.times : [];
  const channels = item.reminder.channels?.length ? item.reminder.channels : ["in_app"];
  const operations = [];
  dates.forEach((dateKey) => times.forEach((time) => channels.forEach((channel) => {
    const [hour, minute] = time.split(":").map(Number);
    const scheduled = zonedDateTimeToUtc({ dateKey, hour, minute }, profile.timezone);
    const dueAt = new Date(scheduled.getTime() - (item.reminder.leadMinutes || 0) * 60000);
    const dedupeKey = `${itemType}:${item._id}:${dateKey}:${time}:${channel}:primary`;
    operations.push({
      updateOne: {
        filter: { dedupeKey },
        update: { $setOnInsert: { user: userId, itemType, itemId: item._id, occurrenceDate: dateKey, dueAt, channel, title: item.name, message: itemType === "medication" ? `Scheduled: ${item.doseText || "your recorded medication"}. Follow your own instructions.` : item.why ? `A small step toward: ${item.why}` : "Still planning to make time for this today?", dedupeKey, state: "pending" } },
        upsert: true,
      },
    });
  })));
  const activeKeys = operations.map((operation) => operation.updateOne.update.$setOnInsert.dedupeKey);
  await LifeNotificationJob.updateMany({ user: userId, itemType, itemId: item._id, state: { $in: ["pending", "retry"] }, ...(activeKeys.length ? { dedupeKey: { $nin: activeKeys } } : {}) }, { $set: { state: "suppressed", suppressedReason: "schedule_replaced" } });
  if (operations.length) await LifeNotificationJob.bulkWrite(operations, { ordered: false });
  return { scheduled: operations.length };
};

const scheduleHabitReminders = (userId, habit, daysAhead = 14, fromDate = null) => scheduleItemReminders(userId, habit, "habit", daysAhead, fromDate);
const scheduleRoutineReminders = (userId, routine, daysAhead = 14, fromDate = null) => scheduleItemReminders(userId, routine, "routine", daysAhead, fromDate);
const scheduleMedicationReminders = (userId, medication, daysAhead = 14, fromDate = null) => scheduleItemReminders(userId, medication, "medication", daysAhead, fromDate);

const replenishReminderJobs = async ({ daysAhead = 14, batchSize = 200, maximum = 5000 } = {}) => {
  const definitions = [[LifeHabit, "habit"], [LifeRoutine, "routine"], [LifeMedication, "medication"]];
  let visited = 0;
  let scheduled = 0;
  for (const [Model, itemType] of definitions) {
    let cursor = null;
    while (visited < maximum) {
      const rows = await Model.find({ status: "active", "reminder.enabled": true, ...(cursor ? { _id: { $gt: cursor } } : {}) }).sort({ _id: 1 }).limit(Math.min(batchSize, maximum - visited)).lean();
      if (!rows.length) break;
      for (let offset = 0; offset < rows.length; offset += 25) {
        const results = await Promise.all(rows.slice(offset, offset + 25).map((item) => scheduleItemReminders(item.user, item, itemType, daysAhead)));
        scheduled += results.reduce((sum, result) => sum + result.scheduled, 0);
      }
      visited += rows.length;
      cursor = rows[rows.length - 1]._id;
      if (rows.length < batchSize) break;
    }
  }
  return { visited, scheduled, truncated: visited >= maximum };
};

const scheduleSnooze = async (userId, event, item) => {
  if (!event.snoozedUntil) return null;
  const dedupeKey = `snooze:${event._id}:in_app`;
  return LifeNotificationJob.findOneAndUpdate(
    { dedupeKey },
    { $setOnInsert: { user: userId, itemType: event.itemType, itemId: event.itemId, occurrenceDate: event.scheduledDate, dueAt: event.snoozedUntil, channel: "in_app", title: item.name || item.title || "Life reminder", message: "Ready when you are.", dedupeKey, state: "pending" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const scheduleBriefJobs = async ({ daysAhead = 1, batchSize = 200 } = {}) => {
  const profiles = await LifeProfile.find({ "notifications.enabled": true, $or: [{ "notifications.morningBrief": true }, { "notifications.eveningSummary": true }] }).sort({ _id: 1 }).limit(Math.min(1000, batchSize)).lean();
  let scheduled = 0;
  for (const profile of profiles) {
    const start = localDateKey(new Date(), profile.timezone);
    for (let offset = 0; offset <= Math.min(7, daysAhead); offset += 1) {
      const dateKey = addLocalDays(start, offset);
      const day = await todayService.getToday(profile.user, dateKey);
      const definitions = [];
      if (profile.notifications.morningBrief && (day.timeline.total || day.upcomingBills.length)) definitions.push({ kind: "morning", time: profile.notifications.morningBriefTime || "07:30", title: "Good morning", message: [day.timeline.total && `${day.timeline.total} planned item${day.timeline.total === 1 ? "" : "s"}`, day.upcomingBills.length && `${day.upcomingBills.length} bill${day.upcomingBills.length === 1 ? "" : "s"} due`].filter(Boolean).join(" · ") });
      if (profile.notifications.eveningSummary && (day.timeline.total || day.summary.water.currentMl || day.summary.exercise.sessions || Object.keys(day.summary.spending).length)) definitions.push({ kind: "evening", time: profile.notifications.eveningSummaryTime || "20:30", title: "A quiet look at today", message: `${day.summary.completed} of ${day.summary.planned} planned items recorded${day.reflection.saved ? " · reflection saved" : " · reflect when useful"}` });
      for (const definition of definitions) {
        const [hour, minute] = definition.time.split(":").map(Number);
        for (const channel of profile.notifications.channels || ["in_app"]) {
          const dedupeKey = `brief:${definition.kind}:${profile.user}:${dateKey}:${channel}`;
          await LifeNotificationJob.updateOne({ dedupeKey }, { $setOnInsert: { user: profile.user, itemType: "brief", itemId: profile._id, occurrenceDate: dateKey, dueAt: zonedDateTimeToUtc({ dateKey, hour, minute }, profile.timezone), channel, title: definition.title, message: definition.message, dedupeKey, state: "pending" } }, { upsert: true });
          scheduled += 1;
        }
      }
    }
  }
  return { profiles: profiles.length, scheduled };
};

const eligibility = async (job, now = new Date()) => {
  const profile = await profileService.getOrCreateProfile(job.user);
  if (!profile.notifications.enabled || !profile.notifications.channels.includes(job.channel)) return { eligible: false, reason: "preferences" };
  const completion = await LifeEvent.findOne({ user: job.user, itemType: job.itemType, itemId: job.itemId, scheduledDate: job.occurrenceDate }).sort({ occurredAt: -1 });
  if (completion && ["completed", "skipped"].includes(completion.status)) return { eligible: false, reason: completion.status };
  const ownerModel = { habit: LifeHabit, medication: LifeMedication, routine: LifeRoutine }[job.itemType];
  if (ownerModel) {
    const item = await ownerModel.findOne({ _id: job.itemId, user: job.user });
    if (!item || item.status !== "active") return { eligible: false, reason: "inactive" };
  }
  const parts = getZonedParts(now, profile.timezone);
  if (isQuietTime(timeText(parts), profile.notifications.quietHours)) return { eligible: false, reason: "quiet_hours", rescheduleAt: quietEndInstant(now, profile) };
  const dateKey = localDateKey(now, profile.timezone);
  const range = zonedDayRange(dateKey, profile.timezone);
  const deliveredToday = await LifeNotificationDelivery.countDocuments({ user: job.user, status: "delivered", attemptedAt: { $gte: range.start, $lt: range.end } });
  if (deliveredToday >= profile.notifications.dailyCap) return { eligible: false, reason: "daily_cap" };
  return { eligible: true };
};

const processOne = async (job, now = new Date()) => {
  const startedAt = Date.now();
  metrics.observe("life_notification_queue_lag_ms", Math.max(0, now.getTime() - new Date(job.dueAt || now).getTime()));
  const allowed = await eligibility(job, now);
  if (!allowed.eligible) {
    if (allowed.rescheduleAt) {
      await LifeNotificationJob.updateOne({ _id: job._id }, { $set: { state: "pending", dueAt: allowed.rescheduleAt, lockedAt: null, suppressedReason: allowed.reason } });
      metrics.increment("life_notification_quiet_reschedules");
      return { state: "rescheduled", reason: allowed.reason };
    }
    await LifeNotificationJob.updateOne({ _id: job._id }, { $set: { state: "suppressed", lockedAt: null, suppressedReason: allowed.reason } });
    await LifeNotificationDelivery.create({ user: job.user, job: job._id, channel: job.channel, status: "suppressed", attempt: job.attempts + 1, latencyMs: Date.now() - startedAt });
    metrics.increment("life_notification_suppressed");
    return { state: "suppressed", reason: allowed.reason };
  }
  const adapter = adapters.get(job.channel);
  if (!adapter) {
    await LifeNotificationJob.updateOne({ _id: job._id }, { $set: { state: "failed", lastErrorCode: "ADAPTER_UNAVAILABLE", lockedAt: null }, $inc: { attempts: 1 } });
    await LifeNotificationDelivery.create({ user: job.user, job: job._id, channel: job.channel, status: "failed", attempt: job.attempts + 1, errorCode: "ADAPTER_UNAVAILABLE", latencyMs: Date.now() - startedAt });
    metrics.increment("life_notification_failures");
    return { state: "failed", reason: "adapter_unavailable" };
  }
  try {
    const result = await adapter.deliver(job);
    await LifeNotificationJob.updateOne({ _id: job._id }, { $set: { state: "delivered", deliveredAt: new Date(), lockedAt: null }, $inc: { attempts: 1 } });
    await LifeNotificationDelivery.create({ user: job.user, job: job._id, channel: job.channel, status: "delivered", attempt: job.attempts + 1, providerMessageId: result.providerMessageId || "", latencyMs: Date.now() - startedAt });
    metrics.increment("life_notification_delivered");
    return { state: "delivered" };
  } catch (error) {
    const attempts = job.attempts + 1;
    const terminal = attempts >= job.maxAttempts || ["PUSH_NOT_SUBSCRIBED", "PUSH_UNAVAILABLE"].includes(error.code);
    const nextAttemptAt = terminal ? null : new Date(now.getTime() + Math.min(60, 2 ** attempts) * 60000);
    await LifeNotificationJob.updateOne({ _id: job._id }, { $set: { state: terminal ? "failed" : "retry", nextAttemptAt, lockedAt: null, lastErrorCode: error.code || "DELIVERY_FAILED" }, $inc: { attempts: 1 } });
    await LifeNotificationDelivery.create({ user: job.user, job: job._id, channel: job.channel, status: "failed", attempt: attempts, errorCode: error.code || "DELIVERY_FAILED", latencyMs: Date.now() - startedAt });
    metrics.increment("life_notification_failures");
    return { state: terminal ? "failed" : "retry" };
  }
};

const processDueNotifications = async ({ now = new Date(), limit = 100 } = {}) => {
  const results = [];
  const staleLock = new Date(now.getTime() - 5 * 60000);
  for (let count = 0; count < Math.min(500, limit); count += 1) {
    const job = await LifeNotificationJob.findOneAndUpdate(
      { dueAt: { $lte: now }, $and: [{ $or: [{ state: { $in: ["pending", "retry"] } }, { state: "processing", lockedAt: { $lte: staleLock } }] }, { $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $lte: now } }] }] },
      { $set: { state: "processing", lockedAt: now } },
      { new: true, sort: { dueAt: 1 } }
    );
    if (!job) break;
    results.push(await processOne(job, now));
  }
  return { processed: results.length, results };
};

module.exports = { eligibility, isQuietTime, processDueNotifications, registerAdapter, replenishReminderJobs, scheduleBriefJobs, scheduleHabitReminders, scheduleItemReminders, scheduleMedicationReminders, scheduleRoutineReminders, scheduleSnooze };
