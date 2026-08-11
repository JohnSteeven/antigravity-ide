const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeFinancePlan = require("../models/LifeFinancePlan");
const LifeGoal = require("../models/LifeGoal");
const LifeHabit = require("../models/LifeHabit");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeJournalEntry = require("../models/LifeJournalEntry");
const LifeMedication = require("../models/LifeMedication");
const LifeRoutine = require("../models/LifeRoutine");
const LifeScheduleVersion = require("../models/LifeScheduleVersion");
const LifeTask = require("../models/LifeTask");
const { isScheduledOnDate } = require("../domain/recurrence");
const { assertDateKey, getZonedParts, localDateKey, zonedDateTimeToUtc } = require("../domain/time");
const eventService = require("./eventService");
const profileService = require("./profileService");
const { progressForGoals } = require("./goalProgressService");

const PERIOD_ORDER = Object.freeze(["all_day", "morning", "afternoon", "evening"]);
const periodForHour = (hour, fallback = "all_day") => fallback !== "all_day" ? fallback : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
const scheduleTimes = (schedule = {}) => schedule.times?.length ? schedule.times : schedule.window?.start ? [schedule.window.start] : [""];

const eventStatus = (event, dateKey, todayKey) => {
  if (event) return event.status;
  if (dateKey < todayKey) return "missed";
  if (dateKey > todayKey) return "upcoming";
  return "pending";
};

const isVacationDate = (profile, dateKey) => Boolean(
  profile.vacationMode?.enabled
  && (!profile.vacationMode.startDate || dateKey >= profile.vacationMode.startDate)
  && (!profile.vacationMode.endDate || dateKey <= profile.vacationMode.endDate)
);

const getToday = async (userId, requestedDate) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const actualToday = localDateKey(new Date(), profile.timezone);
  const dateKey = assertDateKey(requestedDate || actualToday);

  const [versions, tasks, eventsByItem, healthEntries, financeEntries, goals, journalEntry, bills] = await Promise.all([
    LifeScheduleVersion.find({
      user: userId,
      itemType: { $in: ["habit", "routine", "medication"] },
      effectiveFrom: { $lte: dateKey },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: dateKey } }],
    }).lean(),
    LifeTask.find({ user: userId, localDate: dateKey, status: "active" }).sort({ scheduledFor: 1, createdAt: 1 }).lean(),
    eventService.latestEventsForDate(userId, dateKey),
    LifeHealthEntry.find({ user: userId, localDate: dateKey, deletedAt: null }).sort({ occurredAt: 1 }).lean(),
    LifeFinanceEntry.find({ user: userId, localDate: dateKey, deletedAt: null }).sort({ occurredAt: 1 }).lean(),
    LifeGoal.find({ user: userId, status: "active", startDate: { $lte: dateKey } }).lean(),
    LifeJournalEntry.findOne({ user: userId, localDate: dateKey, type: "daily", deletedAt: null }).sort({ occurredAt: -1 }).lean(),
    LifeFinancePlan.find({ user: userId, type: { $in: ["bill", "subscription"] }, status: "active", dueDate: dateKey }).lean(),
  ]);

  const scheduledVersions = isVacationDate(profile, dateKey)
    ? []
    : versions.filter((version) => isScheduledOnDate(version.schedule, dateKey));
  const idsFor = (itemType) => scheduledVersions.filter((version) => version.itemType === itemType).map((version) => version.itemId);
  const activeFilter = dateKey >= actualToday ? { status: "active" } : {};
  const [habits, routines, medications] = await Promise.all([
    LifeHabit.find({ user: userId, _id: { $in: idsFor("habit") }, ...activeFilter }).lean(),
    LifeRoutine.find({ user: userId, _id: { $in: idsFor("routine") }, ...activeFilter }).lean(),
    LifeMedication.find({ user: userId, _id: { $in: idsFor("medication") }, ...activeFilter }).lean(),
  ]);
  const habitById = new Map(habits.map((habit) => [String(habit._id), habit]));
  const routineById = new Map(routines.map((routine) => [String(routine._id), routine]));
  const medicationById = new Map(medications.map((medication) => [String(medication._id), medication]));

  const habitItems = scheduledVersions.filter((version) => version.itemType === "habit").flatMap((version) => {
    const habit = habitById.get(String(version.itemId));
    if (!habit) return [];
    return scheduleTimes(version.schedule).map((time) => {
      const scheduledTime = time || "12:00";
      const [hour, minute] = scheduledTime.split(":").map(Number);
      const occurrenceKey = time || "all-day";
      const event = eventsByItem.get(`habit:${habit._id}:${occurrenceKey}`);
      return {
      id: `${habit._id}:${occurrenceKey}`,
      itemId: String(habit._id),
      type: "habit",
      title: habit.name,
      intent: habit.intent,
      measurementType: habit.measurementType,
      target: habit.target,
      unit: habit.unit,
      period: habit.preferredPeriod === "anytime" ? periodForHour(hour) : habit.preferredPeriod,
      scheduledTime: time,
      scheduledFor: zonedDateTimeToUtc({ dateKey, hour: Number.isFinite(hour) ? hour : 12, minute: Number.isFinite(minute) ? minute : 0 }, version.timezone || profile.timezone),
      status: eventStatus(event, dateKey, actualToday),
      event: event || null,
    }; });
  });

  const routineItems = scheduledVersions.filter((version) => version.itemType === "routine").flatMap((version) => {
    const routine = routineById.get(String(version.itemId));
    if (!routine) return [];
    return scheduleTimes(version.schedule).map((time) => {
      const scheduledTime = time || "12:00";
      const [hour, minute] = scheduledTime.split(":").map(Number);
      const occurrenceKey = time || "all-day";
      const event = eventsByItem.get(`routine:${routine._id}:${occurrenceKey}`);
      const recorded = new Map((event?.routineSteps || []).map((step) => [String(step.stepId || step.title), step.status]));
      return { id: `${routine._id}:${occurrenceKey}`, itemId: String(routine._id), type: "routine", title: routine.name, period: periodForHour(hour), scheduledTime: time, scheduledFor: zonedDateTimeToUtc({ dateKey, hour, minute }, version.timezone || profile.timezone), status: eventStatus(event, dateKey, actualToday), event: event || null, steps: [...(routine.items || [])].sort((a, b) => a.order - b.order).map((step) => ({ id: String(step._id), title: step.title, optional: step.optional, status: recorded.get(String(step._id)) || recorded.get(step.title) || "pending" })) };
    });
  });

  const medicationItems = scheduledVersions.filter((version) => version.itemType === "medication").flatMap((version) => {
    const medication = medicationById.get(String(version.itemId));
    if (!medication) return [];
    return scheduleTimes(version.schedule).map((time) => {
      const scheduledTime = time || "12:00";
      const [hour, minute] = scheduledTime.split(":").map(Number);
      const occurrenceKey = time || "all-day";
      const event = eventsByItem.get(`medication:${medication._id}:${occurrenceKey}`);
      return { id: `${medication._id}:${occurrenceKey}`, itemId: String(medication._id), type: "medication", title: medication.name, doseText: medication.doseText, period: periodForHour(hour), scheduledTime: time, scheduledFor: zonedDateTimeToUtc({ dateKey, hour, minute }, version.timezone || profile.timezone), status: eventStatus(event, dateKey, actualToday), event: event || null };
    });
  });

  const taskItems = tasks.map((task) => {
    const event = eventsByItem.get(`task:${task._id}:all-day`);
    return {
      id: String(task._id), itemId: String(task._id), type: "task", title: task.title, period: task.period, scheduledTime: "",
      scheduledFor: task.scheduledFor, priority: task.priority, linkedGoal: task.linkedGoal,
      status: eventStatus(event, dateKey, actualToday), event: event || null,
    };
  });

  const timeline = [...habitItems, ...routineItems, ...medicationItems, ...taskItems];
  const groups = Object.fromEntries(PERIOD_ORDER.map((period) => [period, timeline.filter((item) => item.period === period)]));
  const waterMl = healthEntries.filter((item) => item.type === "water").reduce((sum, item) => sum + (item.canonicalValue || 0), 0);
  const latestSleep = [...healthEntries].reverse().find((item) => item.type === "sleep") || null;
  const workouts = healthEntries.filter((item) => item.type === "workout");
  const latestMood = [...healthEntries].reverse().find((item) => item.type === "mood") || null;
  const spending = financeEntries.filter((item) => item.type === "expense").reduce((map, item) => {
    map[item.currency] = (map[item.currency] || 0) + item.amountMinor;
    return map;
  }, {});
  const goalProgress = await progressForGoals(userId, goals);

  return {
    date: dateKey,
    timezone: profile.timezone,
    generatedAt: new Date(),
    isToday: dateKey === actualToday,
    vacationMode: isVacationDate(profile, dateKey),
    timeline: { groups, total: timeline.length },
    summary: {
      planned: timeline.length,
      completed: timeline.filter((item) => item.status === "completed").length,
      partial: timeline.filter((item) => item.status === "partial").length,
      skipped: timeline.filter((item) => item.status === "skipped").length,
      missed: timeline.filter((item) => item.status === "missed").length,
      water: { currentMl: waterMl, targetMl: profile.waterTargetMl },
      sleep: latestSleep ? { durationMinutes: latestSleep.durationMinutes, quality: latestSleep.quality } : null,
      exercise: { sessions: workouts.length, durationMinutes: workouts.reduce((sum, item) => sum + (item.durationMinutes || 0), 0) },
      mood: latestMood ? { mood: latestMood.mood, energy: latestMood.energy, stress: latestMood.stress } : null,
      spending,
      goals: goals.map((goal) => ({ id: String(goal._id), title: goal.title, progress: goalProgress.get(String(goal._id)) || 0, targetDate: goal.targetDate })),
    },
    upcomingBills: bills.map((bill) => ({ id: String(bill._id), name: bill.name, amountMinor: bill.amountMinor, currency: bill.currency })),
    reflection: journalEntry ? { id: String(journalEntry._id), saved: true, title: journalEntry.title } : { saved: false },
    visibleModules: profile.visibleModules,
    localNow: getZonedParts(new Date(), profile.timezone),
  };
};

module.exports = { getToday };
