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
  const money = finance.reduce((map, item) => {
    const key = item.currency;
    if (!map[key]) map[key] = { incomeMinor: 0, expenseMinor: 0, categories: {} };
    if (item.type === "expense") {
      map[key].expenseMinor += item.amountMinor;
      map[key].categories[item.category] = (map[key].categories[item.category] || 0) + item.amountMinor;
    } else if (item.type === "income") {
      map[key].incomeMinor += item.amountMinor;
    }
    return map;
  }, {});
  return {
    start,
    end,
    habits: insights.metrics,
    health: healthSummary,
    money,
    goals: goals.map((goal) => ({ id: goal._id, title: goal.title, status: goal.status, progress: goal.manualProgress || 0, updatedAt: goal.updatedAt })),
    events: { completed: currentEvents.filter((item) => item.status === "completed").length, snoozed: currentEvents.filter((item) => item.status === "snoozed").length },
    insights: insights.insights,
    languageBoundary: insights.languageBoundary
  };
};

const buildPeriodicReport = async (userId, options = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const type = options.type === "monthly" ? "monthly" : "weekly";
  const baseDate = assertDateKey(options.date || localDateKey(new Date(), profile.timezone));

  let start, end, prevStart, prevEnd, title, previousTitle;

  if (type === "weekly") {
    const d = new Date(baseDate + "T00:00:00Z");
    const day = d.getUTCDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setUTCDate(d.getUTCDate() + diffToMon);
    start = mon.toISOString().slice(0, 10);
    end = addLocalDays(start, 6);
    prevStart = addLocalDays(start, -7);
    prevEnd = addLocalDays(end, -7);
    title = `Weekly Synthesis (${start} to ${end})`;
    previousTitle = `Previous Week (${prevStart} to ${prevEnd})`;
  } else {
    const year = parseInt(baseDate.slice(0, 4), 10);
    const month = parseInt(baseDate.slice(5, 7), 10);
    start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    prevStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
    const prevLastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    prevEnd = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;
    title = `Monthly Review (${start.slice(0, 7)})`;
    previousTitle = `Previous Month (${prevStart.slice(0, 7)})`;
  }

  const [currentReport, previousReport] = await Promise.all([
    buildReport(userId, { start, end }),
    buildReport(userId, { start: prevStart, end: prevEnd }),
  ]);

  const habitConsistency = currentReport.habits.consistency || 0;
  const prevHabitConsistency = previousReport.habits.consistency || 0;
  const habitDelta = habitConsistency - prevHabitConsistency;
  const habitGrade = habitConsistency >= 85 ? "A" : habitConsistency >= 70 ? "B" : habitConsistency >= 50 ? "C" : "Needs Attention";

  const sleepAvgMin = currentReport.health.sleepAverageMinutes || 0;
  const prevSleepAvgMin = previousReport.health.sleepAverageMinutes || 0;
  const sleepDeltaMin = sleepAvgMin - prevSleepAvgMin;
  const sleepGrade = sleepAvgMin >= 450 ? "A" : sleepAvgMin >= 390 ? "B" : sleepAvgMin >= 330 ? "C" : "Needs Attention";

  const movementTargetMin = type === "weekly" ? 150 : 600;
  const movementMin = currentReport.health.workoutMinutes || 0;
  const prevMovementMin = previousReport.health.workoutMinutes || 0;
  const movementDelta = movementMin - prevMovementMin;
  const movementGrade = movementMin >= movementTargetMin ? "A" : movementMin >= movementTargetMin * 0.6 ? "B" : movementMin >= movementTargetMin * 0.3 ? "C" : "Needs Attention";

  const defaultCurrency = profile.currency || "USD";
  const moneyData = currentReport.money[defaultCurrency] || { incomeMinor: 0, expenseMinor: 0 };
  const prevMoneyData = previousReport.money[defaultCurrency] || { incomeMinor: 0, expenseMinor: 0 };
  const netSavingsMinor = moneyData.incomeMinor - moneyData.expenseMinor;
  const savingsRate = moneyData.incomeMinor > 0 ? Math.round((netSavingsMinor / moneyData.incomeMinor) * 100) : 0;

  const highlights = [];
  if (habitConsistency > 0) {
    highlights.push({
      dimension: "Habits",
      text: `Completed ${currentReport.habits.completed || 0} habits (${habitConsistency}% consistency, ${habitDelta >= 0 ? "+" : ""}${habitDelta}% vs last period).`,
      tone: habitDelta >= 0 ? "positive" : "neutral",
    });
  }
  if (currentReport.health.sleepNights > 0) {
    highlights.push({
      dimension: "Sleep",
      text: `Logged ${currentReport.health.sleepNights} nights with an average of ${Math.floor(sleepAvgMin / 60)}h ${sleepAvgMin % 60}m.`,
      tone: sleepAvgMin >= 420 ? "positive" : "neutral",
    });
  }
  if (currentReport.health.workoutSessions > 0) {
    highlights.push({
      dimension: "Movement",
      text: `${currentReport.health.workoutSessions} movement sessions totaling ${movementMin} minutes (${movementMin >= movementTargetMin ? "met" : `${movementMin}/${movementTargetMin}m of`} target).`,
      tone: movementMin >= movementTargetMin ? "positive" : "neutral",
    });
  }

  return {
    type,
    period: { start, end, title },
    previousPeriod: { start: prevStart, end: prevEnd, title: previousTitle },
    executiveSummary: highlights,
    scorecards: {
      rhythm: {
        title: "Daily Rhythm",
        grade: habitGrade,
        currentValue: `${habitConsistency}%`,
        previousValue: `${prevHabitConsistency}%`,
        delta: habitDelta,
        unit: "consistency",
        metricDetails: currentReport.habits,
      },
      sleep: {
        title: "Sleep & Recovery",
        grade: sleepGrade,
        currentValue: `${Math.floor(sleepAvgMin / 60)}h ${sleepAvgMin % 60}m`,
        previousValue: `${Math.floor(prevSleepAvgMin / 60)}h ${prevSleepAvgMin % 60}m`,
        delta: sleepDeltaMin,
        unit: "minutes",
        nightsLogged: currentReport.health.sleepNights,
      },
      movement: {
        title: "Movement & Fitness",
        grade: movementGrade,
        currentValue: `${movementMin} min`,
        previousValue: `${prevMovementMin} min`,
        delta: movementDelta,
        unit: "minutes",
        target: `${movementTargetMin} min`,
        sessions: currentReport.health.workoutSessions,
      },
      financial: {
        title: "Financial Flow",
        grade: savingsRate > 20 ? "A" : savingsRate > 0 ? "B" : "Neutral",
        currency: defaultCurrency,
        incomeMajor: moneyData.incomeMinor / 100,
        expenseMajor: moneyData.expenseMinor / 100,
        savingsRate: `${savingsRate}%`,
      }
    },
    goals: currentReport.goals,
    insights: currentReport.insights,
    languageBoundary: "Deterministic synthesis generated from recorded user data. Not clinical, diagnostic, or financial advice."
  };
};

module.exports = { buildReport, buildPeriodicReport, resolveRange };
