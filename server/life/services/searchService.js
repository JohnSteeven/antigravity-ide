const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeGoal = require("../models/LifeGoal");
const LifeHabit = require("../models/LifeHabit");
const LifeJournalEntry = require("../models/LifeJournalEntry");
const LifeRoutine = require("../models/LifeRoutine");
const LifeTask = require("../models/LifeTask");

const NAVIGATION = Object.freeze([
  ["today", "Today", "/life/today"], ["habits", "Habits", "/life/habits"],
  ["goals", "Goals", "/life/goals"], ["health", "Health", "/life/health"],
  ["money", "Money", "/life/money"], ["insights", "Insights", "/life/insights"],
  ["journal", "Journal", "/life/journal"], ["settings", "Settings", "/life/settings"],
]);

const COMMANDS = Object.freeze([
  ["log-water", "Log water", "capture", "water"], ["add-expense", "Add expense", "capture", "expense"],
  ["add-action", "Add today's action", "capture", "task"], ["quick-note", "Write a journal note", "capture", "journal"],
  ["check-in", "Record a mood check-in", "capture", "mood"], ["new-habit", "Create a habit", "capture", "habit"],
]);

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const leanLimited = (query, limit) => query.limit(limit).lean();

const searchLife = async (userId, rawQuery, options = {}) => {
  const queryText = String(rawQuery || "").trim().slice(0, 120);
  const limit = Math.min(30, Math.max(5, Number(options.limit) || 20));
  const normalized = queryText.toLowerCase();
  const regex = new RegExp(escapeRegex(queryText), "i");
  const navigation = NAVIGATION.filter(([key, label]) => !queryText || `${key} ${label}`.toLowerCase().includes(normalized)).map(([id, title, path]) => ({ id, type: "navigation", title, path }));
  const commands = COMMANDS.filter(([, title]) => !queryText || title.toLowerCase().includes(normalized) || normalized.split(/\s+/).some((word) => title.toLowerCase().includes(word))).map(([id, title, action, capture]) => ({ id, type: "command", title, action, capture }));
  if (queryText.length < 2) return { query: queryText, results: [...commands, ...navigation].slice(0, limit), privacy: "private_user_scope" };

  const perType = Math.max(2, Math.min(8, Math.ceil(limit / 5)));
  const [habits, goals, routines, tasks, journals, finance] = await Promise.all([
    leanLimited(LifeHabit.find({ user: userId, status: { $ne: "archived" }, $or: [{ name: regex }, { why: regex }] }).select("name why status"), perType),
    leanLimited(LifeGoal.find({ user: userId, status: { $ne: "archived" }, $or: [{ title: regex }, { why: regex }] }).select("title why status"), perType),
    leanLimited(LifeRoutine.find({ user: userId, status: { $ne: "archived" }, name: regex }).select("name status"), perType),
    leanLimited(LifeTask.find({ user: userId, status: "active", $or: [{ title: regex }, { notes: regex }] }).select("title localDate period"), perType),
    leanLimited(LifeJournalEntry.find({ user: userId, deletedAt: null, $or: [{ title: regex }, { body: regex }] }).select("title body localDate type"), perType),
    leanLimited(LifeFinanceEntry.find({ user: userId, deletedAt: null, $or: [{ category: regex }, { payee: regex }, { note: regex }] }).select("type category payee amountMinor currency localDate"), perType),
  ]);
  const results = [
    ...commands, ...navigation,
    ...habits.map((item) => ({ id: item._id, type: "habit", title: item.name, detail: item.why, path: "/life/habits" })),
    ...goals.map((item) => ({ id: item._id, type: "goal", title: item.title, detail: item.why, path: "/life/goals" })),
    ...routines.map((item) => ({ id: item._id, type: "routine", title: item.name, path: "/life/habits" })),
    ...tasks.map((item) => ({ id: item._id, type: "task", title: item.title, detail: item.localDate, path: "/life/today" })),
    ...journals.map((item) => ({ id: item._id, type: "journal", title: item.title || "Untitled reflection", detail: `${item.localDate} · ${String(item.body || "").slice(0, 90)}`, path: "/life/journal" })),
    ...finance.map((item) => ({ id: item._id, type: "money", title: item.payee || item.category, detail: `${item.currency} ${(item.amountMinor / 100).toFixed(2)} · ${item.localDate}`, path: "/life/money" })),
  ];
  return { query: queryText, results: results.slice(0, limit), privacy: "private_user_scope" };
};

module.exports = { searchLife };
