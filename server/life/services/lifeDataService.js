const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeFinancePlan = require("../models/LifeFinancePlan");
const LifeGoal = require("../models/LifeGoal");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeJournalEntry = require("../models/LifeJournalEntry");
const LifeRoutine = require("../models/LifeRoutine");
const LifeScheduleVersion = require("../models/LifeScheduleVersion");
const LifeTask = require("../models/LifeTask");
const { FINANCE_ENTRY_TYPES, FINANCE_PLAN_TYPES, GOAL_STATUSES, HEALTH_ENTRY_TYPES, JOURNAL_ENTRY_TYPES } = require("../domain/constants");
const { sleepDurationMinutes, summarizeBudget, toWaterMl } = require("../domain/calculations");
const { LifeError, notFound } = require("../domain/errors");
const { normalizeSchedule } = require("../domain/recurrence");
const { addLocalDays, assertDateKey, localDateKey } = require("../domain/time");
const profileService = require("./profileService");
const { progressForGoals } = require("./goalProgressService");

const paginate = (query = {}) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(100, Math.max(1, Number(query.limit) || 30)),
});

const listOwned = async (Model, userId, filter = {}, query = {}, sort = { createdAt: -1 }) => {
  const { page, limit } = paginate(query);
  const ownedFilter = { user: userId, ...filter };
  const [items, total] = await Promise.all([
    Model.find(ownedFilter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(ownedFilter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const createGoal = async (userId, input = {}) => {
  if (!String(input.title || "").trim()) throw new LifeError("Give this goal a title.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const startDate = assertDateKey(input.startDate || localDateKey(new Date(), profile.timezone));
  return LifeGoal.create({
    user: userId,
    title: input.title,
    why: input.why || "",
    lifeAreaId: input.lifeAreaId || "",
    startDate,
    targetDate: input.targetDate || null,
    progressStrategy: input.progressStrategy || "manual",
    manualProgress: input.manualProgress || 0,
    currentValue: input.currentValue || 0,
    targetValue: input.targetValue ?? null,
    unit: input.unit || "",
    milestones: Array.isArray(input.milestones) ? input.milestones.slice(0, 100) : [],
    linkedHabits: Array.isArray(input.linkedHabits) ? input.linkedHabits.slice(0, 100) : [],
    notes: input.notes || "",
    status: input.status || "active",
  });
};

const listGoals = async (userId, query = {}) => {
  const result = await listOwned(LifeGoal, userId, query.status && query.status !== "all" ? { status: query.status } : {}, query, { targetDate: 1, createdAt: -1 });
  const progress = await progressForGoals(userId, result.items);
  result.items = result.items.map((goal) => ({ ...goal, progress: progress.get(String(goal._id)) || 0 }));
  return result;
};

const updateGoal = async (userId, goalId, input = {}) => {
  const allowed = ["title", "why", "lifeAreaId", "targetDate", "progressStrategy", "manualProgress", "currentValue", "targetValue", "unit", "milestones", "linkedHabits", "notes", "status", "archivedAt"];
  const updates = Object.fromEntries(allowed.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
  if (updates.status && !GOAL_STATUSES.includes(updates.status)) throw new LifeError("Choose a valid goal status.", 422);
  if (updates.status === "completed") updates.completedAt = new Date();
  const goal = await LifeGoal.findOneAndUpdate({ _id: goalId, user: userId }, { $set: updates }, { new: true, runValidators: true });
  if (!goal) throw notFound("Goal");
  return goal;
};

const archiveGoal = async (userId, goalId) => updateGoal(userId, goalId, { status: "archived", archivedAt: new Date() });

const createTask = async (userId, input = {}) => {
  if (!String(input.title || "").trim()) throw new LifeError("Give this action a title.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const payload = {
    user: userId,
    title: input.title,
    localDate: assertDateKey(input.localDate || localDateKey(new Date(), profile.timezone)),
    scheduledFor: input.scheduledFor || null,
    period: input.period || "all_day",
    priority: input.priority || "none",
    linkedGoal: input.linkedGoal || null,
    lifeAreaId: input.lifeAreaId || "",
    durationEstimateMinutes: input.durationEstimateMinutes ?? null,
    notes: input.notes || "",
    clientMutationId: input.clientMutationId || undefined,
  };
  try { return await LifeTask.create(payload); }
  catch (error) { if (error.code === 11000 && payload.clientMutationId) return LifeTask.findOne({ user: userId, clientMutationId: payload.clientMutationId }); throw error; }
};

const listTasks = (userId, query = {}) => listOwned(LifeTask, userId, {
  ...(query.date ? { localDate: query.date } : {}),
  ...(query.status && query.status !== "all" ? { status: query.status } : { status: "active" }),
}, query, { localDate: 1, scheduledFor: 1 });

const updateTask = async (userId, taskId, input = {}) => {
  const allowed = ["title", "localDate", "scheduledFor", "period", "priority", "linkedGoal", "lifeAreaId", "durationEstimateMinutes", "notes", "status"];
  const updates = Object.fromEntries(allowed.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
  const task = await LifeTask.findOneAndUpdate({ _id: taskId, user: userId }, { $set: updates }, { new: true, runValidators: true });
  if (!task) throw notFound("Task");
  return task;
};

const createRoutine = async (userId, input = {}) => {
  if (!String(input.name || "").trim()) throw new LifeError("Give this routine a name.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const schedule = normalizeSchedule({ ...(input.schedule || {}), startDate: input.schedule?.startDate || localDateKey(new Date(), profile.timezone) });
  const routine = await LifeRoutine.create({
    user: userId,
    name: input.name,
    lifeAreaId: input.lifeAreaId || "",
    items: Array.isArray(input.items) ? input.items.slice(0, 100) : [],
    schedule,
    reminder: input.reminder || {},
  });
  await LifeScheduleVersion.create({ user: userId, itemType: "routine", itemId: routine._id, version: 1, effectiveFrom: schedule.startDate, timezone: profile.timezone, schedule, definitionSnapshot: { name: routine.name } });
  return routine;
};

const listRoutines = (userId, query = {}) => listOwned(LifeRoutine, userId, query.status && query.status !== "all" ? { status: query.status } : { status: "active" }, query);

const updateRoutine = async (userId, routineId, input = {}) => {
  const routine = await LifeRoutine.findOne({ _id: routineId, user: userId });
  if (!routine) throw notFound("Routine");
  const allowed = ["name", "lifeAreaId", "items", "reminder", "status"];
  const updates = Object.fromEntries(allowed.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
  if (input.schedule) {
    const profile = await profileService.getOrCreateProfile(userId);
    const today = localDateKey(new Date(), profile.timezone);
    const effectiveDate = assertDateKey(input.effectiveDate || today);
    if (effectiveDate < today) throw new LifeError("Future routine changes cannot begin in the past.", 422);
    const schedule = normalizeSchedule(input.schedule);
    const nextVersion = routine.currentScheduleVersion + 1;
    try {
      await LifeScheduleVersion.create({ user: userId, itemType: "routine", itemId: routine._id, version: nextVersion, effectiveFrom: effectiveDate, timezone: profile.timezone, schedule, definitionSnapshot: { name: updates.name || routine.name } });
    } catch (error) {
      if (error.code === 11000) throw new LifeError("This routine changed on another device. Refresh and try again.", 409, "LIFE_CONFLICT");
      throw error;
    }
    const updated = await LifeRoutine.findOneAndUpdate(
      { _id: routine._id, user: userId, currentScheduleVersion: routine.currentScheduleVersion },
      { $set: { ...updates, schedule, currentScheduleVersion: nextVersion } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      await LifeScheduleVersion.deleteOne({ user: userId, itemType: "routine", itemId: routine._id, version: nextVersion });
      throw new LifeError("This routine changed on another device. Refresh and try again.", 409, "LIFE_CONFLICT");
    }
    await LifeScheduleVersion.updateOne({ user: userId, itemType: "routine", itemId: routine._id, version: routine.currentScheduleVersion }, { $set: { effectiveTo: addLocalDays(effectiveDate, -1) } });
    return updated;
  }
  Object.assign(routine, updates);
  await routine.save();
  return routine;
};

const createHealthEntry = async (userId, input = {}) => {
  const type = String(input.type || "").toLowerCase();
  if (!HEALTH_ENTRY_TYPES.includes(type)) throw new LifeError("Choose a supported health entry type.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const localDate = assertDateKey(input.localDate || localDateKey(occurredAt, profile.timezone));
  const entry = {
    user: userId, type, localDate, occurredAt,
    value: input.value ?? null, unit: input.unit || "", label: input.label || "", note: input.note || "",
    quality: input.quality ?? null, mood: input.mood ?? null, energy: input.energy ?? null, stress: input.stress ?? null,
    severity: input.severity ?? null, doseText: input.doseText || "", workoutType: input.workoutType || "",
    exercises: Array.isArray(input.exercises) ? input.exercises.slice(0, 100) : [], effort: input.effort ?? null,
    source: input.source || { type: "manual" }, dedupeKey: input.dedupeKey || undefined,
  };
  if (type === "water") {
    entry.canonicalValue = toWaterMl(input.value, input.unit || profile.waterUnit);
    entry.canonicalUnit = "ml";
  }
  if (type === "sleep") {
    if (input.startedAt && input.endedAt) {
      entry.startedAt = new Date(input.startedAt);
      entry.endedAt = new Date(input.endedAt);
      entry.durationMinutes = sleepDurationMinutes(entry.startedAt, entry.endedAt);
    } else entry.durationMinutes = Math.max(0, Number(input.durationMinutes) || 0);
  }
  if (type === "workout") entry.durationMinutes = Math.max(0, Number(input.durationMinutes) || 0);
  try {
    return await LifeHealthEntry.create(entry);
  } catch (error) {
    if (error.code === 11000 && entry.dedupeKey) return LifeHealthEntry.findOne({ user: userId, dedupeKey: entry.dedupeKey });
    throw error;
  }
};

const listHealthEntries = (userId, query = {}) => listOwned(LifeHealthEntry, userId, {
  deletedAt: null,
  ...(query.type ? { type: query.type } : {}),
  ...(query.start || query.end ? { localDate: { ...(query.start ? { $gte: query.start } : {}), ...(query.end ? { $lte: query.end } : {}) } } : {}),
}, query, { occurredAt: -1 });

const healthSummary = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const start = assertDateKey(query.start || end);
  const entries = await LifeHealthEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).sort({ occurredAt: 1 }).lean();
  const waterMl = entries.filter((item) => item.type === "water").reduce((sum, item) => sum + (item.canonicalValue || 0), 0);
  const sleeps = entries.filter((item) => item.type === "sleep" && item.durationMinutes);
  const workouts = entries.filter((item) => item.type === "workout");
  const moods = entries.filter((item) => item.type === "mood" && item.mood);
  return {
    start, end, waterMl,
    sleepAverageMinutes: sleeps.length ? Math.round(sleeps.reduce((sum, item) => sum + item.durationMinutes, 0) / sleeps.length) : null,
    workoutSessions: workouts.length,
    workoutMinutes: workouts.reduce((sum, item) => sum + (item.durationMinutes || 0), 0),
    moodAverage: moods.length ? Number((moods.reduce((sum, item) => sum + item.mood, 0) / moods.length).toFixed(1)) : null,
  };
};

const deleteHealthEntry = async (userId, entryId) => {
  const entry = await LifeHealthEntry.findOneAndUpdate({ _id: entryId, user: userId, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
  if (!entry) throw notFound("Health entry");
  return entry;
};

const createFinanceEntry = async (userId, input = {}) => {
  const type = String(input.type || "expense").toLowerCase();
  if (!FINANCE_ENTRY_TYPES.includes(type)) throw new LifeError("Choose expense, income, or savings contribution.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const currency = String(input.currency || profile.currency).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new LifeError("Choose a valid three-letter currency.", 422);
  const amountMinor = input.amountMinor !== undefined ? Math.round(Number(input.amountMinor)) : Math.round(Number(input.amount) * 100);
  if (!Number.isFinite(amountMinor) || amountMinor < 0) throw new LifeError("Enter a valid non-negative amount.", 422);
  const payload = {
    user: userId, type, amountMinor, currency,
    category: input.category || "Other", payee: input.payee || "", occurredAt,
    localDate: assertDateKey(input.localDate || localDateKey(occurredAt, profile.timezone)),
    paymentMethod: input.paymentMethod || "", note: input.note || "", recurring: Boolean(input.recurring),
    linkedFinancialGoal: input.linkedFinancialGoal || null, source: input.source || { type: "manual" },
    dedupeKey: input.dedupeKey || undefined,
  };
  try {
    return await LifeFinanceEntry.create(payload);
  } catch (error) {
    if (error.code === 11000 && payload.dedupeKey) return LifeFinanceEntry.findOne({ user: userId, dedupeKey: payload.dedupeKey });
    throw error;
  }
};

const listFinanceEntries = (userId, query = {}) => listOwned(LifeFinanceEntry, userId, {
  deletedAt: null,
  ...(query.type ? { type: query.type } : {}),
  ...(query.currency ? { currency: String(query.currency).toUpperCase() } : {}),
  ...(query.start || query.end ? { localDate: { ...(query.start ? { $gte: query.start } : {}), ...(query.end ? { $lte: query.end } : {}) } } : {}),
}, query, { occurredAt: -1 });

const deleteFinanceEntry = async (userId, entryId) => {
  const entry = await LifeFinanceEntry.findOneAndUpdate({ _id: entryId, user: userId, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
  if (!entry) throw notFound("Money entry");
  return entry;
};

const financeSummary = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const start = assertDateKey(query.start || `${end.slice(0, 8)}01`);
  const entries = await LifeFinanceEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).lean();
  const grouped = {};
  entries.forEach((entry) => {
    if (!grouped[entry.currency]) grouped[entry.currency] = { expenseMinor: 0, incomeMinor: 0, savingsMinor: 0, categories: {} };
    const bucket = grouped[entry.currency];
    if (entry.type === "expense") {
      bucket.expenseMinor += entry.amountMinor;
      bucket.categories[entry.category] = (bucket.categories[entry.category] || 0) + entry.amountMinor;
    } else if (entry.type === "income") bucket.incomeMinor += entry.amountMinor;
    else bucket.savingsMinor += entry.amountMinor;
  });
  const plans = await LifeFinancePlan.find({ user: userId, status: "active", type: { $in: ["budget", "bill", "subscription"] } }).lean();
  const budgets = plans.filter((plan) => plan.type === "budget" && Object.keys(grouped).concat(profile.currency).includes(plan.currency));
  const recurring = plans.filter((plan) => ["bill", "subscription"].includes(plan.type));
  const recurringByCurrency = recurring.reduce((map, plan) => {
    if (!map[plan.currency]) map[plan.currency] = { knownMonthlyMinor: 0, unknownCadence: 0, subscriptions: 0, bills: 0 };
    const bucket = map[plan.currency];
    bucket[plan.type === "subscription" ? "subscriptions" : "bills"] += 1;
    if (plan.period === "monthly") bucket.knownMonthlyMinor += plan.amountMinor;
    else if (plan.period === "weekly") bucket.knownMonthlyMinor += Math.round(plan.amountMinor * 52 / 12);
    else bucket.unknownCadence += 1;
    return map;
  }, {});
  const upcomingEnd = addLocalDays(end, 30);
  return {
    start,
    end,
    currencies: grouped,
    budgets: budgets.map((budget) => ({ ...budget, summary: summarizeBudget({ limitMinor: budget.amountMinor, spentMinor: grouped[budget.currency]?.expenseMinor || 0 }) })),
    recurring: recurringByCurrency,
    upcomingBills: recurring.filter((plan) => plan.dueDate && plan.dueDate >= end && plan.dueDate <= upcomingEnd).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 30).map((plan) => ({ id: plan._id, name: plan.name, type: plan.type, dueDate: plan.dueDate, amountMinor: plan.amountMinor, currency: plan.currency })),
    conversionApplied: false,
  };
};

const createFinancePlan = async (userId, input = {}) => {
  const type = String(input.type || "").toLowerCase();
  if (!FINANCE_PLAN_TYPES.includes(type)) throw new LifeError("Choose budget, bill, subscription, or savings goal.", 422);
  if (!String(input.name || "").trim()) throw new LifeError("Give this money plan a name.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const amountMinor = input.amountMinor !== undefined ? Math.round(Number(input.amountMinor)) : Math.round(Number(input.amount) * 100);
  return LifeFinancePlan.create({
    user: userId, type, name: input.name, amountMinor, currency: String(input.currency || profile.currency).toUpperCase(),
    category: input.category || "", period: input.period || (type === "budget" ? "monthly" : "recurring"),
    periodStart: input.periodStart || null, periodEnd: input.periodEnd || null,
    schedule: input.schedule ? normalizeSchedule(input.schedule) : null, reminder: input.reminder || {},
    currentAmountMinor: input.currentAmountMinor || 0, dueDate: input.dueDate || null, notes: input.notes || "",
  });
};

const listFinancePlans = (userId, query = {}) => listOwned(LifeFinancePlan, userId, {
  ...(query.type ? { type: query.type } : {}),
  ...(query.status && query.status !== "all" ? { status: query.status } : { status: "active" }),
}, query);

const updateFinancePlan = async (userId, planId, input = {}) => {
  const allowed = ["name", "amountMinor", "currency", "category", "period", "periodStart", "periodEnd", "schedule", "reminder", "currentAmountMinor", "dueDate", "status", "notes"];
  const updates = Object.fromEntries(allowed.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));
  if (updates.schedule) updates.schedule = normalizeSchedule(updates.schedule);
  const plan = await LifeFinancePlan.findOneAndUpdate({ _id: planId, user: userId }, { $set: updates }, { new: true, runValidators: true });
  if (!plan) throw notFound("Money plan");
  return plan;
};

const createJournalEntry = async (userId, input = {}) => {
  const type = String(input.type || "daily").toLowerCase();
  if (!JOURNAL_ENTRY_TYPES.includes(type)) throw new LifeError("Choose a supported reflection type.", 422);
  if (!String(input.body || "").trim()) throw new LifeError("Write a few words before saving.", 422);
  const profile = await profileService.getOrCreateProfile(userId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const payload = {
    user: userId, type, localDate: assertDateKey(input.localDate || localDateKey(occurredAt, profile.timezone)),
    title: input.title || "", body: input.body, promptResponses: Array.isArray(input.promptResponses) ? input.promptResponses.slice(0, 20) : [],
    occurredAt, pinnedToTimeline: Boolean(input.pinnedToTimeline), dedupeKey: input.dedupeKey || undefined,
  };
  try { return await LifeJournalEntry.create(payload); }
  catch (error) { if (error.code === 11000 && payload.dedupeKey) return LifeJournalEntry.findOne({ user: userId, dedupeKey: payload.dedupeKey }); throw error; }
};

const listJournalEntries = (userId, query = {}) => listOwned(LifeJournalEntry, userId, {
  deletedAt: null,
  ...(query.type ? { type: query.type } : {}),
  ...(query.start || query.end ? { localDate: { ...(query.start ? { $gte: query.start } : {}), ...(query.end ? { $lte: query.end } : {}) } } : {}),
}, query, { localDate: -1, occurredAt: -1 });

const deleteJournalEntry = async (userId, entryId) => {
  const entry = await LifeJournalEntry.findOneAndUpdate({ _id: entryId, user: userId, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true });
  if (!entry) throw notFound("Journal entry");
  return entry;
};

module.exports = {
  archiveGoal,
  createFinanceEntry,
  createFinancePlan,
  createGoal,
  createHealthEntry,
  createJournalEntry,
  createRoutine,
  createTask,
  deleteFinanceEntry,
  deleteHealthEntry,
  deleteJournalEntry,
  financeSummary,
  healthSummary,
  listFinanceEntries,
  listFinancePlans,
  listGoals,
  listHealthEntries,
  listJournalEntries,
  listRoutines,
  listTasks,
  updateFinancePlan,
  updateGoal,
  updateRoutine,
  updateTask,
};
