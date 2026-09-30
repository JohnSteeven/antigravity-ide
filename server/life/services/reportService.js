const LifeEvent = require("../models/LifeEvent");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeGoal = require("../models/LifeGoal");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeJournalEntry = require("../models/LifeJournalEntry");
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
  const type = ["yearly", "monthly", "weekly"].includes(options.type) ? options.type : "weekly";
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
  } else if (type === "monthly") {
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
  } else {
    const year = parseInt(baseDate.slice(0, 4), 10);
    start = `${year}-01-01`;
    end = `${year}-12-31`;
    const prevYear = year - 1;
    prevStart = `${prevYear}-01-01`;
    prevEnd = `${prevYear}-12-31`;
    title = `Yearly Review (${year})`;
    previousTitle = `Previous Year (${prevYear})`;
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

  const movementTargetMin = type === "weekly" ? 150 : type === "monthly" ? 600 : 7200;
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

  let monthlyTrends = [];
  let currencies = {};
  let bodyTrends = null;
  let journalActivity = null;
  let achievements = [];

  if (type === "yearly") {
    const year = parseInt(baseDate.slice(0, 4), 10);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthBuckets = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mStr = String(m).padStart(2, "0");
      return {
        month: `${year}-${mStr}`,
        label: monthNames[i],
        habitsPlanned: 0,
        habitsCompleted: 0,
        habitConsistency: 0,
        sleepNights: 0,
        sleepTotalMinutes: 0,
        sleepAverageMinutes: 0,
        workoutSessions: 0,
        workoutMinutes: 0,
        moodTotal: 0,
        moodCount: 0,
        moodAverage: null,
        bodyWeight: null,
        journalEntries: 0,
        journalWords: 0,
        moneyByCurrency: {},
      };
    });

    const [eventsYear, healthYear, financeYear, journalYear, goalsYear] = await Promise.all([
      LifeEvent.find({ user: userId, scheduledDate: { $gte: start, $lte: end }, itemType: "habit" }).select("scheduledDate status itemId").lean(),
      LifeHealthEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).select("type localDate canonicalValue durationMinutes mood").lean(),
      LifeFinanceEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).select("type amountMinor currency category localDate").lean(),
      LifeJournalEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).select("type localDate wordCount title").lean(),
      LifeGoal.find({ user: userId }).select("title status targetDate manualProgress milestones updatedAt").lean(),
    ]);

    eventsYear.forEach((ev) => {
      const m = parseInt(ev.scheduledDate.slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) {
        monthBuckets[m].habitsPlanned++;
        if (ev.status === "completed") monthBuckets[m].habitsCompleted++;
      }
    });

    healthYear.forEach((h) => {
      const m = parseInt(h.localDate.slice(5, 7), 10) - 1;
      if (m >= 0 && m < 12) {
        if (h.type === "sleep" && h.durationMinutes) {
          monthBuckets[m].sleepNights++;
          monthBuckets[m].sleepTotalMinutes += h.durationMinutes;
        } else if (h.type === "workout" && h.durationMinutes) {
          monthBuckets[m].workoutSessions++;
          monthBuckets[m].workoutMinutes += h.durationMinutes;
        } else if ((h.type === "mood" || h.mood) && (h.canonicalValue != null || h.mood != null)) {
          const val = h.canonicalValue != null ? h.canonicalValue : h.mood;
          if (typeof val === "number") {
            monthBuckets[m].moodTotal += val;
            monthBuckets[m].moodCount++;
          }
        } else if (["weight", "body_weight"].includes(h.type) && h.canonicalValue) {
          monthBuckets[m].bodyWeight = h.canonicalValue;
        }
      }
    });

    financeYear.forEach((f) => {
      const m = parseInt(f.localDate.slice(5, 7), 10) - 1;
      const curr = f.currency || defaultCurrency;
      if (!currencies[curr]) {
        currencies[curr] = { incomeMinor: 0, expenseMinor: 0, netMinor: 0 };
      }
      if (f.type === "income") {
        currencies[curr].incomeMinor += f.amountMinor;
      } else if (f.type === "expense") {
        currencies[curr].expenseMinor += f.amountMinor;
      }

      if (m >= 0 && m < 12) {
        if (!monthBuckets[m].moneyByCurrency[curr]) {
          monthBuckets[m].moneyByCurrency[curr] = { incomeMinor: 0, expenseMinor: 0 };
        }
        if (f.type === "income") {
          monthBuckets[m].moneyByCurrency[curr].incomeMinor += f.amountMinor;
        } else if (f.type === "expense") {
          monthBuckets[m].moneyByCurrency[curr].expenseMinor += f.amountMinor;
        }
      }
    });

    Object.keys(currencies).forEach((c) => {
      currencies[c].netMinor = currencies[c].incomeMinor - currencies[c].expenseMinor;
    });

    let totalJournalWords = 0;
    const journalByType = {};
    journalYear.forEach((j) => {
      const m = parseInt(j.localDate.slice(5, 7), 10) - 1;
      const wc = j.wordCount || 0;
      totalJournalWords += wc;
      journalByType[j.type] = (journalByType[j.type] || 0) + 1;
      if (m >= 0 && m < 12) {
        monthBuckets[m].journalEntries++;
        monthBuckets[m].journalWords += wc;
      }
    });

    journalActivity = {
      totalEntries: journalYear.length,
      totalWords: totalJournalWords,
      byType: journalByType,
      activeMonthsCount: monthBuckets.filter((b) => b.journalEntries > 0).length,
    };

    monthBuckets.forEach((b) => {
      if (b.habitsPlanned > 0) {
        b.habitConsistency = Math.round((b.habitsCompleted / b.habitsPlanned) * 100);
      }
      if (b.sleepNights > 0) {
        b.sleepAverageMinutes = Math.round(b.sleepTotalMinutes / b.sleepNights);
      }
      if (b.moodCount > 0) {
        b.moodAverage = Math.round((b.moodTotal / b.moodCount) * 10) / 10;
      }
    });

    monthlyTrends = monthBuckets;

    const weightsWithDate = healthYear
      .filter((h) => ["weight", "body_weight"].includes(h.type) && h.canonicalValue)
      .sort((a, b) => a.localDate.localeCompare(b.localDate));
    if (weightsWithDate.length > 0) {
      bodyTrends = {
        firstRecorded: weightsWithDate[0].canonicalValue,
        latestRecorded: weightsWithDate[weightsWithDate.length - 1].canonicalValue,
        delta: Math.round((weightsWithDate[weightsWithDate.length - 1].canonicalValue - weightsWithDate[0].canonicalValue) * 10) / 10,
        entriesCount: weightsWithDate.length,
      };
    }

    const completedGoals = goalsYear.filter((g) => g.status === "completed");
    if (completedGoals.length > 0) {
      achievements.push({
        type: "goals",
        title: "Goals Completed",
        description: `Achieved ${completedGoals.length} major goal${completedGoals.length > 1 ? "s" : ""}: ${completedGoals.map((g) => g.title).join(", ")}.`,
      });
    }

    const totalHabitsCompleted = monthBuckets.reduce((s, b) => s + b.habitsCompleted, 0);
    if (totalHabitsCompleted > 0) {
      const bestHabitMonth = [...monthBuckets].sort((a, b) => b.habitConsistency - a.habitConsistency)[0];
      achievements.push({
        type: "habits",
        title: "Habit Consistency Peak",
        description: `Completed ${totalHabitsCompleted} daily rhythm practices across the year, peaking in ${bestHabitMonth.label} (${bestHabitMonth.habitConsistency}%).`,
      });
    }

    const totalMovementMin = monthBuckets.reduce((s, b) => s + b.workoutMinutes, 0);
    if (totalMovementMin > 0) {
      achievements.push({
        type: "fitness",
        title: "Movement Volume",
        description: `Logged ${Math.round(totalMovementMin / 60)} hours of physical activity across ${monthBuckets.reduce((s, b) => s + b.workoutSessions, 0)} sessions.`,
      });
    }

    if (journalYear.length > 0) {
      achievements.push({
        type: "journal",
        title: "Self-Reflection Practice",
        description: `Penned ${journalYear.length} private journal reflections totaling ~${totalJournalWords} words across ${journalActivity.activeMonthsCount} active months.`,
      });
    }
  }

  return {
    type,
    period: { start, end, title, year: type === "yearly" ? parseInt(baseDate.slice(0, 4), 10) : undefined },
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
    monthlyTrends,
    currencies,
    bodyTrends,
    journalActivity,
    achievements,
    languageBoundary: "Deterministic synthesis generated from recorded user data. Not clinical, diagnostic, or financial advice."
  };
};

module.exports = { buildReport, buildPeriodicReport, resolveRange };
