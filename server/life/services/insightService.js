const LifeEvent = require("../models/LifeEvent");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeGoal = require("../models/LifeGoal");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeInsight = require("../models/LifeInsight");
const LifeInsightPreference = require("../models/LifeInsightPreference");
const LifeScheduleVersion = require("../models/LifeScheduleVersion");
const mongoose = require("mongoose");
const { addLocalDays, assertDateKey, enumerateDateKeys, localDateKey } = require("../domain/time");
const { isScheduledOnDate } = require("../domain/recurrence");
const profileService = require("./profileService");

const ratio = (value, total) => total ? Math.round((value / total) * 100) : 0;

const plannedHabitCount = async (userId, dateKeys) => {
  const start = dateKeys[0];
  const end = dateKeys[dateKeys.length - 1];
  const versions = await LifeScheduleVersion.find({
    user: userId, itemType: "habit", effectiveFrom: { $lte: end },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: start } }],
  }).lean();
  return versions.reduce((count, version) => count + dateKeys.filter((date) => (
    date >= version.effectiveFrom && (!version.effectiveTo || date <= version.effectiveTo) && isScheduledOnDate(version.schedule, date)
  )).length * Math.max(1, version.schedule?.times?.length || 0), 0);
};

const buildInsights = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const start = assertDateKey(query.start || addLocalDays(end, -6));
  const dates = enumerateDateKeys(start, end, 366);
  const previousStart = addLocalDays(start, -dates.length);
  const previousEnd = addLocalDays(start, -1);
  const previousDates = enumerateDateKeys(previousStart, previousEnd, 366);
  const [events, previousEvents, planned, previousPlanned, health, finance, goals] = await Promise.all([
    LifeEvent.find({ user: userId, scheduledDate: { $gte: start, $lte: end } }).lean(),
    LifeEvent.find({ user: userId, scheduledDate: { $gte: previousStart, $lte: previousEnd } }).lean(),
    plannedHabitCount(userId, dates),
    plannedHabitCount(userId, previousDates),
    LifeHealthEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).lean(),
    LifeFinanceEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).lean(),
    LifeGoal.find({ user: userId, status: "active" }).lean(),
  ]);

  const latestByOccurrence = (rows) => [...rows].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt)).reduce((map, event) => map.set(`${event.itemType}:${event.itemId}:${event.scheduledDate}`, event), new Map());
  const currentLatest = [...latestByOccurrence(events).values()];
  const previousLatest = [...latestByOccurrence(previousEvents).values()];
  const completed = currentLatest.filter((event) => event.status === "completed").length;
  const previousCompleted = previousLatest.filter((event) => event.status === "completed").length;
  const consistency = ratio(completed, planned);
  const previousConsistency = ratio(previousCompleted, previousPlanned);
  const generated = [];

  if (planned >= 3) {
    const delta = consistency - previousConsistency;
    generated.push({
      type: "habit_consistency",
      kind: "observation",
      message: delta === 0
        ? `Your recorded habit consistency held at ${consistency}% for this period.`
        : `Your recorded habit consistency was ${consistency}%, ${Math.abs(delta)} points ${delta > 0 ? "higher" : "lower"} than the previous period.`,
      sourceMetrics: { planned, completed, consistency, previousConsistency },
      sampleSize: planned,
      quality: planned >= 5 ? "high" : "low",
    });
  }

  const sleeps = health.filter((entry) => entry.type === "sleep" && entry.durationMinutes);
  if (sleeps.length >= 3) {
    const average = Math.round(sleeps.reduce((sum, entry) => sum + entry.durationMinutes, 0) / sleeps.length);
    generated.push({ type: "sleep_average", kind: "observation", message: `Your recorded sleep averaged ${Math.floor(average / 60)}h ${average % 60}m across ${sleeps.length} nights.`, sourceMetrics: { averageMinutes: average, nights: sleeps.length }, sampleSize: sleeps.length, quality: sleeps.length >= 5 ? "high" : "medium" });
  }

  const snoozes = currentLatest.filter((event) => event.status === "snoozed");
  if (currentLatest.length >= 8 && snoozes.length >= 3) generated.push({ type: "snooze_frequency", kind: "observation", message: `${snoozes.length} of ${currentLatest.length} recorded item outcomes were snoozed in this period. This may be worth reviewing without changing any reminder automatically.`, sourceMetrics: { snoozed: snoozes.length, recorded: currentLatest.length }, sampleSize: currentLatest.length, quality: currentLatest.length >= 14 ? "high" : "medium" });

  const workouts = health.filter((entry) => entry.type === "workout");
  if (workouts.length >= 3) generated.push({ type: "workout_frequency", kind: "observation", message: `You recorded ${workouts.length} movement sessions in this period.`, sourceMetrics: { sessions: workouts.length, minutes: workouts.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0) }, sampleSize: workouts.length, quality: workouts.length >= 5 ? "high" : "medium" });

  const expenses = finance.filter((entry) => entry.type === "expense");
  const byCurrency = expenses.reduce((map, entry) => {
    map[entry.currency] = (map[entry.currency] || 0) + entry.amountMinor;
    return map;
  }, {});
  Object.entries(byCurrency).forEach(([currency, amountMinor]) => expenses.filter((entry) => entry.currency === currency).length >= 2 && generated.push({
    type: `spending_${currency.toLowerCase()}`,
    kind: "observation",
    message: `You recorded ${expenses.filter((entry) => entry.currency === currency).length} ${currency} expenses in this period.`,
    sourceMetrics: { currency, amountMinor, count: expenses.filter((entry) => entry.currency === currency).length },
    sampleSize: expenses.filter((entry) => entry.currency === currency).length,
    quality: "high",
  }));

  const inactiveGoals = goals.filter((goal) => !goal.updatedAt || new Date(goal.updatedAt).toISOString().slice(0, 10) < start);
  if (inactiveGoals.length) generated.push({ type: "goal_attention", kind: "suggestion", message: `${inactiveGoals.length} active ${inactiveGoals.length === 1 ? "goal has" : "goals have"} no recorded update in this period. You may want to review whether the next action is clear.`, sourceMetrics: { inactiveGoalCount: inactiveGoals.length }, quality: "medium" });

  const windowKey = `${start}:${end}`;
  // Unit/domain callers may use non-database identifiers. Production requests
  // always carry an ObjectId; keep the pure insight rules testable without
  // allowing Mongoose to throw before the persisted insight seam is reached.
  const hiddenPreferences = mongoose.isValidObjectId(userId)
    ? await LifeInsightPreference.find({ user: userId, hidden: true, type: { $in: generated.map((item) => item.type) } }).select("type").lean()
    : [];
  const hiddenTypes = new Set(hiddenPreferences.map((item) => item.type));
  const eligible = generated.filter((insight) => !hiddenTypes.has(insight.type));
  const persisted = await Promise.all(eligible.map((insight) => LifeInsight.findOneAndUpdate(
    { user: userId, type: insight.type, windowKey },
    { $set: { ...insight, sourceRange: { start, end }, generatedAt: new Date() }, $setOnInsert: { user: userId, windowKey } },
    { new: true, upsert: true, runValidators: true }
  ).lean()));

  return {
    start, end,
    metrics: { planned, completed, partial: currentLatest.filter((event) => event.status === "partial").length, skipped: currentLatest.filter((event) => event.status === "skipped").length, missed: Math.max(0, planned - currentLatest.filter((event) => ["completed", "partial", "skipped"].includes(event.status)).length), consistency },
    insights: persisted.filter((insight) => !insight.dismissedAt),
    languageBoundary: "Observations describe recorded data and do not provide medical or financial conclusions.",
  };
};

const dismissInsight = async (userId, insightId) => LifeInsight.findOneAndUpdate({ _id: insightId, user: userId }, { $set: { dismissedAt: new Date() } }, { new: true });

const recordInsightFeedback = async (userId, insightId, action) => {
  const insight = await LifeInsight.findOne({ _id: insightId, user: userId });
  if (!insight) return null;
  if (action === "dismiss") { insight.dismissedAt = new Date(); await insight.save(); }
  if (action === "useful") { insight.usefulAt = new Date(); await insight.save(); await LifeInsightPreference.findOneAndUpdate({ user: userId, type: insight.type }, { $inc: { usefulCount: 1 }, $setOnInsert: { user: userId, type: insight.type } }, { upsert: true }); }
  if (action === "hide_similar") { await LifeInsightPreference.findOneAndUpdate({ user: userId, type: insight.type }, { $set: { hidden: true }, $setOnInsert: { user: userId, type: insight.type } }, { upsert: true }); await LifeInsight.updateMany({ user: userId, type: insight.type }, { $set: { dismissedAt: new Date() } }); }
  return insight;
};

module.exports = { buildInsights, dismissInsight, plannedHabitCount, recordInsightFeedback };
