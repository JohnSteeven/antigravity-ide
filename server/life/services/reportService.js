const LifeEvent = require("../models/LifeEvent");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeGoal = require("../models/LifeGoal");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const { addLocalDays, assertDateKey, enumerateDateKeys, localDateKey } = require("../domain/time");
const profileService = require("./profileService");
const insightService = require("./insightService");

const resolveRange = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const preset = [7, 30, 90].includes(Number(query.days)) ? Number(query.days) : query.period === "ytd" ? null : 7;
  const start = assertDateKey(query.start || (query.period === "ytd" ? `${end.slice(0, 4)}-01-01` : addLocalDays(end, -(preset - 1))));
  enumerateDateKeys(start, end, 366);
  return { start, end };
};

const buildReport = async (userId, query = {}) => {
  const { start, end } = await resolveRange(userId, query);
  const [insights, events, health, finance, goals] = await Promise.all([
    insightService.buildInsights(userId, { start, end }),
    LifeEvent.find({ user: userId, scheduledDate: { $gte: start, $lte: end } }).select("status itemType itemId scheduledDate scheduledTime occurredAt").lean(),
    LifeHealthEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).select("type localDate canonicalValue durationMinutes mood").lean(),
    LifeFinanceEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).select("type amountMinor currency category localDate").lean(),
    LifeGoal.find({ user: userId, status: { $in: ["active", "paused", "completed"] } }).select("title status updatedAt targetDate manualProgress").lean(),
  ]);
  const latest = [...events].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt)).reduce((map, item) => map.set(`${item.itemType}:${item.itemId}:${item.scheduledDate}:${item.scheduledTime || ""}`, item), new Map());
  const currentEvents = [...latest.values()];
  const healthSummary = {
    waterMl: health.filter((item) => item.type === "water").reduce((sum, item) => sum + (item.canonicalValue || 0), 0),
    sleepNights: health.filter((item) => item.type === "sleep" && item.durationMinutes).length,
    sleepAverageMinutes: 0,
    workoutSessions: health.filter((item) => item.type === "workout").length,
    workoutMinutes: health.filter((item) => item.type === "workout").reduce((sum, item) => sum + (item.durationMinutes || 0), 0),
  };
  const sleeps = health.filter((item) => item.type === "sleep" && item.durationMinutes);
  if (sleeps.length) healthSummary.sleepAverageMinutes = Math.round(sleeps.reduce((sum, item) => sum + item.durationMinutes, 0) / sleeps.length);
  const money = finance.reduce((map, item) => { const key = item.currency; if (!map[key]) map[key] = { incomeMinor: 0, expenseMinor: 0, categories: {} }; if (item.type === "expense") { map[key].expenseMinor += item.amountMinor; map[key].categories[item.category] = (map[key].categories[item.category] || 0) + item.amountMinor; } else if (item.type === "income") map[key].incomeMinor += item.amountMinor; return map; }, {});
  return { start, end, habits: insights.metrics, health: healthSummary, money, goals: goals.map((goal) => ({ id: goal._id, title: goal.title, status: goal.status, progress: goal.manualProgress || 0, updatedAt: goal.updatedAt })), events: { completed: currentEvents.filter((item) => item.status === "completed").length, snoozed: currentEvents.filter((item) => item.status === "snoozed").length }, insights: insights.insights, languageBoundary: insights.languageBoundary };
};

module.exports = { buildReport, resolveRange };
