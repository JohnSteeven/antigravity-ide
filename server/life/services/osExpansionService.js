const LifeHabit = require("../models/LifeHabit");
const LifeGoal = require("../models/LifeGoal");
const LifeEvent = require("../models/LifeEvent");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeFinancePlan = require("../models/LifeFinancePlan");
const LifeFinanceAccount = require("../models/LifeFinanceAccount");
const LifeJournalEntry = require("../models/LifeJournalEntry");
const profileService = require("./profileService");
const { calculateGoalProgress } = require("../domain/calculations");
const { notFound } = require("../domain/errors");
const { localDateKey, addLocalDays } = require("../domain/time");

const daysBetween = (startKey, endKey) => {
  const d1 = new Date(startKey);
  const d2 = new Date(endKey);
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
};

const getHabitDetail = async (userId, habitId) => {
  const habit = await LifeHabit.findOne({ _id: habitId, user: userId }).lean();
  if (!habit) throw notFound("Habit");
  return habit;
};

const getHabitAnalytics = async (userId, habitId, query = {}) => {
  const habit = await getHabitDetail(userId, habitId);
  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);

  const days = Math.min(365, Math.max(7, Number(query.days) || 365));
  const cutoffDate = addLocalDays(today, -days);

  const events = await LifeEvent.find({
    user: userId,
    itemType: "habit",
    itemId: habitId,
    scheduledDate: { $gte: cutoffDate },
  }).sort({ scheduledDate: -1, occurredAt: -1 }).lean();

  const completedEvents = events.filter((e) => e.status === "completed");
  const completionDatesSet = new Set(completedEvents.map((e) => e.scheduledDate));

  const heatmap = [];
  for (let i = days; i >= 0; i--) {
    const d = addLocalDays(today, -i);
    heatmap.push({
      date: d,
      count: completionDatesSet.has(d) ? 1 : 0,
    });
  }

  const sortedDates = [...completionDatesSet].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let running = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = sortedDates[i - 1];
      const curr = sortedDates[i];
      if (addLocalDays(prev, 1) === curr) {
        running += 1;
      } else {
        running = 1;
      }
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
  }

  let checkDate = completionDatesSet.has(today) ? today : addLocalDays(today, -1);
  if (completionDatesSet.has(checkDate)) {
    while (completionDatesSet.has(checkDate)) {
      currentStreak += 1;
      checkDate = addLocalDays(checkDate, -1);
    }
  }

  const last30Cutoff = addLocalDays(today, -30);
  const completionsLast30 = completedEvents.filter((e) => e.scheduledDate >= last30Cutoff).length;
  const monthlyConsistency = Math.round((completionsLast30 / 30) * 100);

  const totalPossibleDays = Math.min(days, daysBetween(habit.schedule?.startDate || cutoffDate, today));
  const yearlyConsistency = Math.round((completedEvents.length / totalPossibleDays) * 100);

  const notes = completedEvents
    .filter((e) => e.note && e.note.trim().length > 0)
    .slice(0, 30)
    .map((e) => ({
      date: e.scheduledDate,
      occurredAt: e.occurredAt,
      note: e.note,
    }));

  const moodEntries = await LifeHealthEntry.find({
    user: userId,
    type: "mood",
    localDate: { $gte: addLocalDays(today, -60) },
    deletedAt: null,
  }).lean();

  let moodCompletionSum = 0;
  let moodCompletionCount = 0;
  let moodOtherSum = 0;
  let moodOtherCount = 0;

  moodEntries.forEach((entry) => {
    if (entry.mood != null) {
      if (completionDatesSet.has(entry.localDate)) {
        moodCompletionSum += entry.mood;
        moodCompletionCount += 1;
      } else {
        moodOtherSum += entry.mood;
        moodOtherCount += 1;
      }
    }
  });

  const correlation = {
    avgMoodOnCompletionDays: moodCompletionCount > 0 ? Number((moodCompletionSum / moodCompletionCount).toFixed(1)) : null,
    avgMoodOnOtherDays: moodOtherCount > 0 ? Number((moodOtherSum / moodOtherCount).toFixed(1)) : null,
    sampleSizeDays: moodEntries.length,
  };

  return {
    habit,
    currentStreak,
    longestStreak,
    totalCompletions: completedEvents.length,
    monthlyConsistency,
    yearlyConsistency,
    heatmap,
    notes,
    correlation,
  };
};

const getGoalDetail = async (userId, goalId) => {
  const goal = await LifeGoal.findOne({ _id: goalId, user: userId }).lean();
  if (!goal) throw notFound("Goal");
  return goal;
};

const getGoalAnalytics = async (userId, goalId) => {
  const goal = await getGoalDetail(userId, goalId);
  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);

  let linkedCompletions = 0;
  let linkedHabitDetails = [];

  if (goal.linkedHabits?.length > 0) {
    const habits = await LifeHabit.find({ _id: { $in: goal.linkedHabits }, user: userId }).lean();
    const habitEvents = await LifeEvent.find({
      user: userId,
      itemType: "habit",
      itemId: { $in: goal.linkedHabits },
      status: "completed",
    }).lean();

    linkedCompletions = habitEvents.length;

    linkedHabitDetails = habits.map((h) => {
      const hEvents = habitEvents.filter((e) => String(e.itemId) === String(h._id));
      const last30Cutoff = addLocalDays(today, -30);
      const last30Count = hEvents.filter((e) => e.scheduledDate >= last30Cutoff).length;
      return {
        id: String(h._id),
        name: h.name,
        target: h.target,
        unit: h.unit,
        totalCompletions: hEvents.length,
        last30DaysCount: last30Count,
        consistency30: Math.round((last30Count / 30) * 100),
      };
    });
  }

  const progressPercent = calculateGoalProgress(goal, { linkedCompletions });

  const elapsedDays = daysBetween(goal.startDate, today);
  let velocity = null;
  let estimatedCompletionDate = null;
  let daysRemaining = null;

  if (goal.progressStrategy === "metric" && goal.targetValue && goal.targetValue > 0) {
    const remaining = Math.max(0, goal.targetValue - (goal.currentValue || 0));
    if (elapsedDays > 0 && (goal.currentValue || 0) > 0) {
      velocity = Number(((goal.currentValue || 0) / elapsedDays).toFixed(2));
      if (velocity > 0 && remaining > 0) {
        daysRemaining = Math.ceil(remaining / velocity);
        estimatedCompletionDate = addLocalDays(today, daysRemaining);
      }
    }
  } else if (goal.progressStrategy === "milestones" && goal.milestones?.length > 0) {
    const completedCount = goal.milestones.filter((m) => m.completedAt).length;
    const remainingCount = goal.milestones.length - completedCount;
    if (elapsedDays > 0 && completedCount > 0) {
      velocity = Number((completedCount / elapsedDays).toFixed(3));
      if (velocity > 0 && remainingCount > 0) {
        daysRemaining = Math.ceil(remainingCount / velocity);
        estimatedCompletionDate = addLocalDays(today, daysRemaining);
      }
    }
  } else if (goal.progressStrategy === "habit" && linkedCompletions > 0 && goal.targetValue) {
    const remaining = Math.max(0, goal.targetValue - linkedCompletions);
    velocity = Number((linkedCompletions / elapsedDays).toFixed(2));
    if (velocity > 0 && remaining > 0) {
      daysRemaining = Math.ceil(remaining / velocity);
      estimatedCompletionDate = addLocalDays(today, daysRemaining);
    }
  }

  const milestones = (goal.milestones || []).map((m) => ({
    id: String(m._id),
    title: m.title,
    targetDate: m.targetDate,
    completedAt: m.completedAt,
    isCompleted: Boolean(m.completedAt),
  }));

  const completedMilestones = milestones.filter((m) => m.isCompleted).length;
  const nextMilestone = milestones.find((m) => !m.isCompleted) || null;

  return {
    goal,
    progressPercent,
    elapsedDays,
    velocity,
    velocityUnit: goal.progressStrategy === "metric" ? `${goal.unit || "units"} / day` : goal.progressStrategy === "habit" ? "completions / day" : "milestones / day",
    daysRemaining,
    estimatedCompletionDate,
    milestones,
    milestoneStats: {
      total: milestones.length,
      completed: completedMilestones,
      pending: milestones.length - completedMilestones,
    },
    nextMilestone,
    linkedHabits: linkedHabitDetails,
  };
};

const toggleMilestone = async (userId, goalId, milestoneId, completed) => {
  const goal = await LifeGoal.findOne({ _id: goalId, user: userId });
  if (!goal) throw notFound("Goal");

  const milestone = goal.milestones.id(milestoneId);
  if (!milestone) throw notFound("Milestone");

  milestone.completedAt = completed ? new Date() : null;
  await goal.save();
  return goal;
};

const addMilestone = async (userId, goalId, { title, targetDate }) => {
  const goal = await LifeGoal.findOne({ _id: goalId, user: userId });
  if (!goal) throw notFound("Goal");

  goal.milestones.push({
    title: String(title).trim(),
    targetDate: targetDate || null,
    order: goal.milestones.length,
  });

  await goal.save();
  return goal;
};

const listAccounts = async (userId) => {
  const accounts = await LifeFinanceAccount.find({ user: userId, isArchived: false }).sort({ createdAt: 1 }).lean();
  return { items: accounts };
};

const createAccount = async (userId, input) => {
  const balanceMinor = input.balanceMinor != null
    ? Number(input.balanceMinor)
    : input.balance != null
      ? Math.round(Number(input.balance) * 100)
      : 0;

  const account = await LifeFinanceAccount.create({
    user: userId,
    name: input.name,
    type: input.type || "bank",
    balanceMinor,
    currency: (input.currency || "USD").toUpperCase(),
    institution: input.institution || "",
    notes: input.notes || "",
  });
  return account;
};

const updateAccount = async (userId, accountId, input) => {
  const account = await LifeFinanceAccount.findOne({ _id: accountId, user: userId });
  if (!account) throw notFound("Account");

  if (input.name !== undefined) account.name = input.name;
  if (input.type !== undefined) account.type = input.type;
  if (input.balance !== undefined) account.balanceMinor = Math.round(Number(input.balance) * 100);
  if (input.balanceMinor !== undefined) account.balanceMinor = Number(input.balanceMinor);
  if (input.currency !== undefined) account.currency = input.currency.toUpperCase();
  if (input.institution !== undefined) account.institution = input.institution;
  if (input.notes !== undefined) account.notes = input.notes;
  if (input.isArchived !== undefined) account.isArchived = input.isArchived;

  await account.save();
  return account;
};

const deleteAccount = async (userId, accountId) => {
  const account = await LifeFinanceAccount.findOneAndUpdate(
    { _id: accountId, user: userId },
    { $set: { isArchived: true } },
    { new: true }
  );
  if (!account) throw notFound("Account");
  return account;
};

const cashflowAnalytics = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);
  const days = Math.min(365, Math.max(14, Number(query.days) || 90));
  const cutoffDate = addLocalDays(today, -days);

  const transactions = await LifeFinanceEntry.find({
    user: userId,
    localDate: { $gte: cutoffDate },
    deletedAt: null,
  }).sort({ localDate: 1 }).lean();

  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;
  const byCategory = {};
  const dailySeriesMap = {};

  transactions.forEach((tx) => {
    const amount = tx.amountMinor || 0;
    if (tx.type === "income") {
      totalIncomeMinor += amount;
    } else if (tx.type === "expense") {
      totalExpenseMinor += amount;
      const cat = tx.category || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    }

    if (!dailySeriesMap[tx.localDate]) {
      dailySeriesMap[tx.localDate] = { income: 0, expense: 0 };
    }
    if (tx.type === "income") dailySeriesMap[tx.localDate].income += amount;
    if (tx.type === "expense") dailySeriesMap[tx.localDate].expense += amount;
  });

  const series = Object.entries(dailySeriesMap).map(([date, d]) => ({
    date,
    income: Number((d.income / 100).toFixed(2)),
    expense: Number((d.expense / 100).toFixed(2)),
    net: Number(((d.income - d.expense) / 100).toFixed(2)),
  }));

  const netSavingsMinor = totalIncomeMinor - totalExpenseMinor;
  const savingsRate = totalIncomeMinor > 0
    ? Math.round((netSavingsMinor / totalIncomeMinor) * 100)
    : 0;

  return {
    timeframeDays: days,
    totalIncome: Number((totalIncomeMinor / 100).toFixed(2)),
    totalExpense: Number((totalExpenseMinor / 100).toFixed(2)),
    netSavings: Number((netSavingsMinor / 100).toFixed(2)),
    savingsRate,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, Number((v / 100).toFixed(2))])
    ),
    series,
  };
};

const markBillPaid = async (userId, planId, { localDate, createTransaction = true, notes } = {}) => {
  const plan = await LifeFinancePlan.findOne({ _id: planId, user: userId });
  if (!plan) throw notFound("Bill or Subscription");

  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);
  const paymentDate = localDate || today;

  let transaction = null;
  if (createTransaction) {
    transaction = await LifeFinanceEntry.create({
      user: userId,
      type: "expense",
      amountMinor: plan.amountMinor,
      currency: plan.currency,
      category: plan.category || (plan.type === "subscription" ? "Subscriptions" : "Bills & Utilities"),
      label: `Payment: ${plan.name}`,
      localDate: paymentDate,
      note: notes || "Marked as paid in Life Bill Tracker",
      source: { type: "system", provider: "bill_tracker" },
      occurredAt: new Date(),
    });
  }

  if (plan.dueDate) {
    if (plan.period === "monthly" || plan.type === "subscription") {
      plan.dueDate = addLocalDays(plan.dueDate, 30);
    } else if (plan.period === "weekly") {
      plan.dueDate = addLocalDays(plan.dueDate, 7);
    } else {
      plan.status = "completed";
    }
  }

  plan.currentAmountMinor = (plan.currentAmountMinor || 0) + plan.amountMinor;
  await plan.save();

  return {
    plan,
    transaction,
    message: "Bill marked as paid in tracker. No financial funds were transferred.",
  };
};

const searchJournal = async (userId, query = {}) => {
  const filter = { user: userId, deletedAt: null };

  if (query.type) {
    filter.type = query.type;
  }
  if (query.pinned === "true" || query.pinned === true) {
    filter.pinnedToTimeline = true;
  }
  if (query.startDate || query.endDate) {
    filter.localDate = {};
    if (query.startDate) filter.localDate.$gte = query.startDate;
    if (query.endDate) filter.localDate.$lte = query.endDate;
  }
  if (query.q && String(query.q).trim()) {
    const regex = new RegExp(String(query.q).trim(), "i");
    filter.$or = [
      { title: regex },
      { body: regex },
      { "promptResponses.response": regex },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const [items, total] = await Promise.all([
    LifeJournalEntry.find(filter).sort({ localDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    LifeJournalEntry.countDocuments(filter),
  ]);

  const enrichedItems = items.map((entry) => {
    const wordCount = (entry.body || "").trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    return {
      ...entry,
      wordCount,
      readingTimeMinutes,
    };
  });

  return {
    items: enrichedItems,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const journalAnalytics = async (userId) => {
  const entries = await LifeJournalEntry.find({ user: userId, deletedAt: null }).lean();

  let totalWords = 0;
  const byType = {};
  const activeDates = new Set();

  entries.forEach((e) => {
    const words = (e.body || "").trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;
    byType[e.type] = (byType[e.type] || 0) + 1;
    if (e.localDate) activeDates.add(e.localDate);
  });

  return {
    totalEntries: entries.length,
    totalWords,
    avgWordsPerEntry: entries.length > 0 ? Math.round(totalWords / entries.length) : 0,
    uniqueWritingDays: activeDates.size,
    byType,
  };
};

module.exports = {
  getHabitDetail,
  getHabitAnalytics,
  getGoalDetail,
  getGoalAnalytics,
  toggleMilestone,
  addMilestone,
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  cashflowAnalytics,
  markBillPaid,
  searchJournal,
  journalAnalytics,
};
