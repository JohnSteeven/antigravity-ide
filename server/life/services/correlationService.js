const LifeDailySummary = require("../models/LifeDailySummary");
const LifeSleepSession = require("../models/LifeSleepSession");
const LifeWorkoutSession = require("../models/LifeWorkoutSession");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeEvent = require("../models/LifeEvent");
const { addLocalDays, assertDateKey, enumerateDateKeys, localDateKey } = require("../domain/time");
const profileService = require("./profileService");

function calculatePearson(pairs) {
  const n = pairs.length;
  if (n < 7) {
    return {
      sampleSize: n,
      insufficientData: true,
      requiredMin: 7,
      r: null,
      strength: "insufficient_data",
      description: `Insufficient data (${n}/7 paired days recorded). Keep logging to reveal patterns.`
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const [x, y] of pairs) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denom === 0 || isNaN(denom)) {
    return {
      sampleSize: n,
      insufficientData: false,
      r: 0,
      strength: "neutral_or_weak",
      description: "No variation detected in observed values."
    };
  }

  const r = Math.round((numerator / denom) * 100) / 100;
  let strength = "neutral_or_weak";

  if (r >= 0.6) strength = "strong_positive";
  else if (r >= 0.3) strength = "moderate_positive";
  else if (r <= -0.6) strength = "strong_negative";
  else if (r <= -0.3) strength = "moderate_negative";

  let description = "No clear correlation observed in this timeframe.";
  if (r > 0.3) {
    description = `Positive correlation (r = ${r}): as one increases, the other tends to increase.`;
  } else if (r < -0.3) {
    description = `Inverse correlation (r = ${r}): as one increases, the other tends to decrease.`;
  }

  return {
    sampleSize: n,
    insufficientData: false,
    r,
    strength,
    description
  };
}

const getCorrelations = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const days = Math.min(365, Math.max(7, Number(query.days) || 30));
  const start = assertDateKey(query.start || addLocalDays(end, -(days - 1)));
  const dates = enumerateDateKeys(start, end, 366);

  const [dailySummaries, sleepSessions, workoutSessions, financeEntries, healthEntries, events] = await Promise.all([
    LifeDailySummary.find({ user: userId, date: { $gte: start, $lte: end } }).lean(),
    LifeSleepSession.find({ user: userId, deletedAt: null, date: { $gte: start, $lte: end } }).lean(),
    LifeWorkoutSession.find({ user: userId, deletedAt: null, date: { $gte: start, $lte: end } }).lean(),
    LifeFinanceEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).lean(),
    LifeHealthEntry.find({ user: userId, deletedAt: null, localDate: { $gte: start, $lte: end } }).lean(),
    LifeEvent.find({ user: userId, scheduledDate: { $gte: start, $lte: end } }).lean(),
  ]);

  const dayMap = {};
  dates.forEach((d) => {
    dayMap[d] = {
      date: d,
      sleepMinutes: null,
      sleepScore: null,
      workoutMinutes: 0,
      habitPlanned: 0,
      habitCompleted: 0,
      habitRate: null,
      expensesMajor: 0,
      mood: null,
      energy: null,
      stress: null,
    };
  });

  dailySummaries.forEach((s) => {
    if (dayMap[s.date]) {
      if (s.signals?.sleepDurationMinutes) dayMap[s.date].sleepMinutes = s.signals.sleepDurationMinutes;
      if (s.signals?.workoutMinutes) dayMap[s.date].workoutMinutes = s.signals.workoutMinutes;
      if (s.signals?.habitScore != null) dayMap[s.date].habitRate = s.signals.habitScore;
      if (s.signals?.energyScore != null) dayMap[s.date].energy = s.signals.energyScore;
      if (s.signals?.moodScore != null) dayMap[s.date].mood = s.signals.moodScore;
      if (s.signals?.stressScore != null) dayMap[s.date].stress = s.signals.stressScore;
    }
  });

  sleepSessions.forEach((s) => {
    if (dayMap[s.date]) {
      dayMap[s.date].sleepMinutes = (dayMap[s.date].sleepMinutes || 0) + (s.durationMinutes || 0);
      if (s.qualityScore) dayMap[s.date].sleepScore = s.qualityScore;
    }
  });

  workoutSessions.forEach((w) => {
    if (dayMap[w.date]) {
      dayMap[w.date].workoutMinutes += (w.durationMinutes || 0);
    }
  });

  healthEntries.forEach((h) => {
    if (!dayMap[h.localDate]) return;
    if (h.type === "sleep" && h.durationMinutes) {
      dayMap[h.localDate].sleepMinutes = Math.max(dayMap[h.localDate].sleepMinutes || 0, h.durationMinutes);
    }
    if (h.type === "workout" && h.durationMinutes) {
      dayMap[h.localDate].workoutMinutes += h.durationMinutes;
    }
    if (h.type === "mood" && h.canonicalValue != null) {
      dayMap[h.localDate].mood = h.canonicalValue;
    }
    if (h.type === "energy" && h.canonicalValue != null) {
      dayMap[h.localDate].energy = h.canonicalValue;
    }
    if (h.type === "stress" && h.canonicalValue != null) {
      dayMap[h.localDate].stress = h.canonicalValue;
    }
  });

  financeEntries.forEach((f) => {
    if (dayMap[f.localDate] && f.type === "expense") {
      dayMap[f.localDate].expensesMajor += (f.amountMinor || 0) / 100;
    }
  });

  const habitEvents = events.filter((e) => e.itemType === "habit");
  habitEvents.forEach((e) => {
    if (dayMap[e.scheduledDate]) {
      dayMap[e.scheduledDate].habitPlanned++;
      if (e.status === "completed") dayMap[e.scheduledDate].habitCompleted++;
    }
  });
  dates.forEach((d) => {
    if (dayMap[d].habitRate === null && dayMap[d].habitPlanned > 0) {
      dayMap[d].habitRate = Math.round((dayMap[d].habitCompleted / dayMap[d].habitPlanned) * 100);
    }
  });

  const sleepEnergyPairs = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const today = dayMap[dates[i]];
    const tomorrow = dayMap[dates[i + 1]];
    if (today.sleepMinutes && tomorrow.energy != null) {
      const sleepHours = Math.round((today.sleepMinutes / 60) * 10) / 10;
      sleepEnergyPairs.push([sleepHours, tomorrow.energy]);
    }
  }

  const workoutSleepPairs = [];
  dates.forEach((d) => {
    const day = dayMap[d];
    if (day.workoutMinutes > 0 && day.sleepMinutes != null) {
      const sleepHours = Math.round((day.sleepMinutes / 60) * 10) / 10;
      workoutSleepPairs.push([day.workoutMinutes, sleepHours]);
    }
  });

  const habitMoodPairs = [];
  dates.forEach((d) => {
    const day = dayMap[d];
    if (day.habitRate != null && day.mood != null) {
      habitMoodPairs.push([day.habitRate, day.mood]);
    }
  });

  const spendingStressPairs = [];
  dates.forEach((d) => {
    const day = dayMap[d];
    if (day.expensesMajor > 0 && day.stress != null) {
      spendingStressPairs.push([day.expensesMajor, day.stress]);
    }
  });

  const correlationSleepEnergy = {
    id: "sleep_vs_energy",
    title: "Sleep Duration → Next-Day Energy",
    independentVar: { label: "Sleep Duration", unit: "hours" },
    dependentVar: { label: "Next-Day Energy", unit: "pts" },
    ...calculatePearson(sleepEnergyPairs),
    pairs: sleepEnergyPairs.map(([x, y]) => ({ x, y }))
  };

  const correlationWorkoutSleep = {
    id: "movement_vs_sleep",
    title: "Movement Sessions → Sleep Duration",
    independentVar: { label: "Movement Duration", unit: "minutes" },
    dependentVar: { label: "Sleep Duration", unit: "hours" },
    ...calculatePearson(workoutSleepPairs),
    pairs: workoutSleepPairs.map(([x, y]) => ({ x, y }))
  };

  const correlationHabitMood = {
    id: "habits_vs_mood",
    title: "Habit Consistency → Daily Mood",
    independentVar: { label: "Habit Completion", unit: "%" },
    dependentVar: { label: "Reported Mood", unit: "pts" },
    ...calculatePearson(habitMoodPairs),
    pairs: habitMoodPairs.map(([x, y]) => ({ x, y }))
  };

  const correlationSpendingStress = {
    id: "spending_vs_stress",
    title: "Daily Spending → Stress Level",
    independentVar: { label: "Spending Amount", unit: profile.currency || "USD" },
    dependentVar: { label: "Recorded Stress", unit: "pts" },
    ...calculatePearson(spendingStressPairs),
    pairs: spendingStressPairs.map(([x, y]) => ({ x, y }))
  };

  return {
    start,
    end,
    days,
    correlations: [
      correlationSleepEnergy,
      correlationWorkoutSleep,
      correlationHabitMood,
      correlationSpendingStress,
    ],
    languageBoundary: "Correlations reflect observational associations in recorded data and do not imply medical causality or financial diagnosis."
  };
};

module.exports = {
  calculatePearson,
  getCorrelations,
};
