const LifeBodyEntry = require("../models/LifeBodyEntry");
const LifeSleepSession = require("../models/LifeSleepSession");
const LifeWorkoutSession = require("../models/LifeWorkoutSession");
const LifeNutritionEntry = require("../models/LifeNutritionEntry");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeDailySummary = require("../models/LifeDailySummary");
const LifeFinancePlan = require("../models/LifeFinancePlan");
const LifeHabit = require("../models/LifeHabit");
const LifeTask = require("../models/LifeTask");
const LifeEvent = require("../models/LifeEvent");
const profileService = require("./profileService");
const { LifeError, notFound } = require("../domain/errors");
const { assertDateKey, localDateKey } = require("../domain/time");

const paginate = (query = {}) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(100, Math.max(1, Number(query.limit) || 30)),
});

const listOwned = async (Model, userId, filter = {}, query = {}, sort = { occurredAt: -1, createdAt: -1 }) => {
  const { page, limit } = paginate(query);
  const ownedFilter = { user: userId, deletedAt: null, ...filter };
  const [items, total] = await Promise.all([
    Model.find(ownedFilter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(ownedFilter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

// ==========================================
// 1. BODY & VITALS
// ==========================================

const deriveBmi = (weight, weightUnit, height, heightUnit) => {
  if (!weight || !height) return null;
  const weightKg = weightUnit === "lb" ? weight * 0.45359237 : weight;
  const heightM = heightUnit === "in" ? (height * 2.54) / 100 : height / 100;
  if (heightM <= 0) return null;
  const bmi = weightKg / (heightM * heightM);
  return Number.isFinite(bmi) && bmi > 5 && bmi < 100 ? Number(bmi.toFixed(1)) : null;
};

const createBodyEntry = async (userId, input = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const localDate = assertDateKey(input.localDate || localDateKey(occurredAt, profile.timezone));
  const weightUnit = input.weightUnit || profile.weightUnit || "kg";
  const heightUnit = input.heightUnit || profile.heightUnit || "cm";
  const height = input.height ?? profile.height ?? null;

  const bmi = input.bmi ?? deriveBmi(input.weight, weightUnit, height, heightUnit);

  const payload = {
    user: userId,
    localDate,
    occurredAt,
    timezone: input.timezone || profile.timezone,
    weight: input.weight ?? null,
    weightUnit,
    height,
    heightUnit,
    bmi,
    bodyFatPercentage: input.bodyFatPercentage ?? null,
    muscleMass: input.muscleMass ?? null,
    circumferences: input.circumferences || {},
    vitals: input.vitals || {},
    note: input.note || "",
    dedupeKey: input.dedupeKey || undefined,
    source: input.source || { type: "manual" },
  };

  try {
    return await LifeBodyEntry.create(payload);
  } catch (error) {
    if (error.code === 11000 && payload.dedupeKey) {
      return LifeBodyEntry.findOne({ user: userId, dedupeKey: payload.dedupeKey });
    }
    throw error;
  }
};

const listBodyEntries = async (userId, query = {}) => {
  const filter = {};
  if (query.start || query.end) {
    filter.localDate = {
      ...(query.start ? { $gte: query.start } : {}),
      ...(query.end ? { $lte: query.end } : {}),
    };
  }
  return listOwned(LifeBodyEntry, userId, filter, query, { occurredAt: -1 });
};

const deleteBodyEntry = async (userId, id) => {
  const entry = await LifeBodyEntry.findOneAndUpdate(
    { _id: id, user: userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!entry) throw notFound("Body entry");
  return entry;
};

const bodySummary = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const entries = await LifeBodyEntry.find({
    user: userId,
    deletedAt: null,
    localDate: { $lte: end },
  }).sort({ occurredAt: -1 }).limit(90).lean();

  const latest = entries[0] || null;
  const weights = entries.filter((e) => e.weight !== null && e.weight !== undefined);
  const recent7 = weights.slice(0, 7);
  const recent30 = weights.slice(0, 30);

  const avg7 = recent7.length ? Number((recent7.reduce((s, e) => s + e.weight, 0) / recent7.length).toFixed(1)) : null;
  const avg30 = recent30.length ? Number((recent30.reduce((s, e) => s + e.weight, 0) / recent30.length).toFixed(1)) : null;
  const change30 = weights.length >= 2 ? Number((weights[0].weight - weights[weights.length - 1].weight).toFixed(1)) : 0;

  return {
    latest,
    stats: {
      currentWeight: latest?.weight ?? null,
      unit: latest?.weightUnit || profile.weightUnit || "kg",
      currentBmi: latest?.bmi ?? null,
      currentBodyFat: latest?.bodyFatPercentage ?? null,
      average7Days: avg7,
      average30Days: avg30,
      change30Days: change30,
      targetWeight: profile.targetWeight ?? null,
      totalEntries: entries.length,
    },
    history: entries.slice(0, 30),
  };
};

const listVitals = async (userId, query = {}) => {
  const entries = await LifeBodyEntry.find({
    user: userId,
    deletedAt: null,
    $or: [
      { "vitals.systolicBp": { $ne: null } },
      { "vitals.restingHeartRate": { $ne: null } },
      { "vitals.spo2": { $ne: null } },
      { "vitals.temperature": { $ne: null } },
      { "vitals.bloodGlucose": { $ne: null } },
    ],
  }).sort({ occurredAt: -1 }).limit(60).lean();

  const latest = entries[0]?.vitals || null;
  return {
    latest,
    items: entries.map((e) => ({
      id: e._id,
      localDate: e.localDate,
      occurredAt: e.occurredAt,
      vitals: e.vitals,
      source: e.source,
      note: e.note,
    })),
  };
};

// ==========================================
// 2. SLEEP & RECOVERY
// ==========================================

const createSleepSession = async (userId, input = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const start = new Date(input.sleepStart);
  const end = new Date(input.sleepEnd);
  let durationMinutes = Number(input.durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    durationMinutes = Math.round((end - start) / 60000);
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0 || durationMinutes > 1440) {
    throw new LifeError("Sleep session must be within 24 hours.", 422);
  }
  const localDate = assertDateKey(input.localDate || localDateKey(end, profile.timezone));

  const payload = {
    user: userId,
    localDate,
    sessionType: input.sessionType || "main",
    sleepStart: start,
    sleepEnd: end,
    durationMinutes,
    quality: input.quality ?? null,
    awakenings: input.awakenings ?? 0,
    refreshedRating: input.refreshedRating ?? null,
    awakeMinutes: input.awakeMinutes ?? null,
    lightMinutes: input.lightMinutes ?? null,
    deepMinutes: input.deepMinutes ?? null,
    remMinutes: input.remMinutes ?? null,
    restingHeartRate: input.restingHeartRate ?? null,
    hrv: input.hrv ?? null,
    spo2Average: input.spo2Average ?? null,
    note: input.note || "",
    dedupeKey: input.dedupeKey || undefined,
    source: input.source || { type: "manual" },
  };

  try {
    return await LifeSleepSession.create(payload);
  } catch (error) {
    if (error.code === 11000 && payload.dedupeKey) {
      return LifeSleepSession.findOne({ user: userId, dedupeKey: payload.dedupeKey });
    }
    throw error;
  }
};

const listSleepSessions = async (userId, query = {}) => {
  const filter = {};
  if (query.start || query.end) {
    filter.localDate = {
      ...(query.start ? { $gte: query.start } : {}),
      ...(query.end ? { $lte: query.end } : {}),
    };
  }
  if (query.sessionType) filter.sessionType = query.sessionType;
  return listOwned(LifeSleepSession, userId, filter, query, { sleepEnd: -1 });
};

const deleteSleepSession = async (userId, id) => {
  const entry = await LifeSleepSession.findOneAndUpdate(
    { _id: id, user: userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!entry) throw notFound("Sleep session");
  return entry;
};

const sleepAnalytics = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const targetMinutes = profile.sleepTargetMinutes || 480; // 8 hours default
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const sessions = await LifeSleepSession.find({
    user: userId,
    deletedAt: null,
    localDate: { $lte: end },
  }).sort({ sleepEnd: -1 }).limit(60).lean();

  const mainSessions = sessions.filter((s) => s.sessionType === "main");
  const latest = mainSessions[0] || sessions[0] || null;

  const recent7 = mainSessions.slice(0, 7);
  const recent30 = mainSessions.slice(0, 30);

  const avg7 = recent7.length ? Math.round(recent7.reduce((s, e) => s + e.durationMinutes, 0) / recent7.length) : null;
  const avg30 = recent30.length ? Math.round(recent30.reduce((s, e) => s + e.durationMinutes, 0) / recent30.length) : null;

  // Sleep debt: cumulative deficit over last 7 days compared to target
  const sleepDebtMinutes = recent7.reduce((debt, s) => {
    const diff = targetMinutes - s.durationMinutes;
    return debt + (diff > 0 ? diff : 0);
  }, 0);

  // Transparent recovery/readiness-style wellness indicator (non-medical)
  let wellnessRecovery = null;
  if (latest && latest.durationMinutes > 0) {
    const durationScore = Math.min(100, Math.round((latest.durationMinutes / targetMinutes) * 100));
    const qualityScore = latest.quality ? latest.quality * 20 : 70;
    const refreshedScore = latest.refreshedRating ? latest.refreshedRating * 20 : 70;
    let score = Math.round(durationScore * 0.5 + qualityScore * 0.25 + refreshedScore * 0.25);
    if (latest.hrv) {
      score = Math.round(durationScore * 0.4 + qualityScore * 0.2 + refreshedScore * 0.2 + Math.min(100, latest.hrv) * 0.2);
    }
    wellnessRecovery = {
      score: Math.min(100, Math.max(0, score)),
      components: {
        durationScore,
        qualityScore,
        refreshedScore,
        hrvIncluded: Boolean(latest.hrv),
      },
      formula: "Weighted blend of duration attainment (50%), user quality (25%), and refreshed rating (25%). Non-medical wellness estimate.",
      disclaimer: "Wellness indicator only. Not a medical diagnosis or sensor-grade readiness score.",
    };
  }

  return {
    latest,
    targetMinutes,
    stats: {
      average7DaysMinutes: avg7,
      average30DaysMinutes: avg30,
      sleepDebtMinutes,
      targetAttainmentPercent: latest ? Math.round((latest.durationMinutes / targetMinutes) * 100) : 0,
      totalSessions: sessions.length,
      napCount7Days: sessions.filter((s) => s.sessionType === "nap" && s.localDate >= recent7[recent7.length - 1]?.localDate).length,
    },
    wellnessRecovery,
    history: sessions.slice(0, 30),
  };
};

// ==========================================
// 3. FITNESS & TRAINING
// ==========================================

const createWorkoutSession = async (userId, input = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
  const endedAt = input.endedAt ? new Date(input.endedAt) : null;
  const localDate = assertDateKey(input.localDate || localDateKey(startedAt, profile.timezone));
  const durationMinutes = Math.max(0, Number(input.durationMinutes) || 0);

  const payload = {
    user: userId,
    localDate,
    workoutType: input.workoutType || "custom",
    title: input.title || "",
    startedAt,
    endedAt,
    durationMinutes,
    distance: input.distance ?? null,
    distanceUnit: input.distanceUnit || "",
    activeCalories: input.activeCalories ?? null,
    effort: input.effort ?? null,
    exercises: Array.isArray(input.exercises) ? input.exercises : [],
    note: input.note || "",
    dedupeKey: input.dedupeKey || undefined,
    source: input.source || { type: "manual" },
  };

  try {
    return await LifeWorkoutSession.create(payload);
  } catch (error) {
    if (error.code === 11000 && payload.dedupeKey) {
      return LifeWorkoutSession.findOne({ user: userId, dedupeKey: payload.dedupeKey });
    }
    throw error;
  }
};

const listWorkoutSessions = async (userId, query = {}) => {
  const filter = {};
  if (query.start || query.end) {
    filter.localDate = {
      ...(query.start ? { $gte: query.start } : {}),
      ...(query.end ? { $lte: query.end } : {}),
    };
  }
  if (query.workoutType) filter.workoutType = query.workoutType;
  return listOwned(LifeWorkoutSession, userId, filter, query, { startedAt: -1, createdAt: -1 });
};

const deleteWorkoutSession = async (userId, id) => {
  const entry = await LifeWorkoutSession.findOneAndUpdate(
    { _id: id, user: userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!entry) throw notFound("Workout session");
  return entry;
};

const fitnessSummary = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const sessions = await LifeWorkoutSession.find({
    user: userId,
    deletedAt: null,
    localDate: { $lte: end },
  }).sort({ startedAt: -1 }).limit(100).lean();

  const recent7 = sessions.filter((s) => s.localDate >= end.slice(0, 8) + "01" || sessions.indexOf(s) < 14);
  const totalMinutes7 = recent7.slice(0, 7).reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const totalSessions7 = recent7.slice(0, 7).length;

  const activityBreakdown = {};
  sessions.forEach((s) => {
    const type = s.workoutType || "custom";
    activityBreakdown[type] = (activityBreakdown[type] || 0) + 1;
  });

  return {
    weeklyMinutes: totalMinutes7,
    weeklySessions: totalSessions7,
    activityBreakdown,
    totalSessions: sessions.length,
    recentSessions: sessions.slice(0, 20),
  };
};

const strengthVolumeAnalytics = async (userId, query = {}) => {
  const sessions = await LifeWorkoutSession.find({
    user: userId,
    deletedAt: null,
    "exercises.0": { $exists: true },
  }).sort({ startedAt: -1 }).limit(100).lean();

  const exerciseMap = new Map();
  let totalVolumeAllTime = 0;

  sessions.forEach((session) => {
    (session.exercises || []).forEach((ex) => {
      const name = String(ex.name || "").trim().toLowerCase();
      if (!name) return;

      let sessionExerciseVolume = 0;
      let maxWeight = 0;

      (ex.sets || []).forEach((set) => {
        const reps = Number(set.reps) || 0;
        const weight = Number(set.weight) || 0;
        const vol = reps * weight;
        sessionExerciseVolume += vol;
        if (weight > maxWeight) maxWeight = weight;
      });

      totalVolumeAllTime += sessionExerciseVolume;

      if (!exerciseMap.has(name)) {
        exerciseMap.set(name, {
          name: ex.name,
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          prMaxWeight: 0,
          prMaxSessionVolume: 0,
          history: [],
        });
      }

      const record = exerciseMap.get(name);
      record.totalVolume += sessionExerciseVolume;
      if (maxWeight > record.prMaxWeight) record.prMaxWeight = maxWeight;
      if (sessionExerciseVolume > record.prMaxSessionVolume) record.prMaxSessionVolume = sessionExerciseVolume;
      record.history.push({
        date: session.localDate,
        setsCount: ex.sets?.length || 0,
        maxWeight,
        volume: sessionExerciseVolume,
      });
    });
  });

  const exercises = Array.from(exerciseMap.values());
  return {
    totalVolumeAllTime,
    exerciseCount: exercises.length,
    exercises,
  };
};

// ==========================================
// 4. NUTRITION
// ==========================================

const createNutritionEntry = async (userId, input = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const localDate = assertDateKey(input.localDate || localDateKey(occurredAt, profile.timezone));

  const payload = {
    user: userId,
    localDate,
    occurredAt,
    mealType: input.mealType || "snack",
    name: input.name,
    servings: input.servings ?? 1,
    calories: Math.max(0, Number(input.calories) || 0),
    protein: input.protein !== undefined && input.protein !== null ? Math.max(0, Number(input.protein)) : null,
    carbs: input.carbs !== undefined && input.carbs !== null ? Math.max(0, Number(input.carbs)) : null,
    fat: input.fat !== undefined && input.fat !== null ? Math.max(0, Number(input.fat)) : null,
    fiber: input.fiber !== undefined && input.fiber !== null ? Math.max(0, Number(input.fiber)) : null,
    sugar: input.sugar !== undefined && input.sugar !== null ? Math.max(0, Number(input.sugar)) : null,
    sodium: input.sodium !== undefined && input.sodium !== null ? Math.max(0, Number(input.sodium)) : null,
    note: input.note || "",
    dedupeKey: input.dedupeKey || undefined,
    source: input.source || { type: "manual" },
  };

  try {
    return await LifeNutritionEntry.create(payload);
  } catch (error) {
    if (error.code === 11000 && payload.dedupeKey) {
      return LifeNutritionEntry.findOne({ user: userId, dedupeKey: payload.dedupeKey });
    }
    throw error;
  }
};

const listNutritionEntries = async (userId, query = {}) => {
  const filter = {};
  if (query.start || query.end) {
    filter.localDate = {
      ...(query.start ? { $gte: query.start } : {}),
      ...(query.end ? { $lte: query.end } : {}),
    };
  }
  if (query.mealType) filter.mealType = query.mealType;
  return listOwned(LifeNutritionEntry, userId, filter, query, { occurredAt: 1 });
};

const deleteNutritionEntry = async (userId, id) => {
  const entry = await LifeNutritionEntry.findOneAndUpdate(
    { _id: id, user: userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!entry) throw notFound("Nutrition entry");
  return entry;
};

const nutritionSummary = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const targetCalories = profile.nutritionTargetCalories || 2000;
  const dateKey = assertDateKey(query.date || query.end || localDateKey(new Date(), profile.timezone));

  const dayEntries = await LifeNutritionEntry.find({
    user: userId,
    deletedAt: null,
    localDate: dateKey,
  }).sort({ occurredAt: 1 }).lean();

  const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  dayEntries.forEach((entry) => {
    const meal = entry.mealType || "snack";
    if (meals[meal]) meals[meal].push(entry);
    totalCalories += entry.calories || 0;
    totalProtein += entry.protein || 0;
    totalCarbs += entry.carbs || 0;
    totalFat += entry.fat || 0;
    totalFiber += entry.fiber || 0;
  });

  return {
    date: dateKey,
    targetCalories,
    totals: {
      calories: totalCalories,
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber),
    },
    macroDistribution: [
      { name: "Protein", grams: Math.round(totalProtein), calories: Math.round(totalProtein * 4), color: "#38bdf8" },
      { name: "Carbs", grams: Math.round(totalCarbs), calories: Math.round(totalCarbs * 4), color: "#34d399" },
      { name: "Fat", grams: Math.round(totalFat), calories: Math.round(totalFat * 9), color: "#f59e0b" },
    ],
    meals,
    entries: dayEntries,
  };
};

// ==========================================
// 5. MIND & MOOD
// ==========================================

const createMindEntry = async (userId, input = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const localDate = assertDateKey(input.localDate || localDateKey(occurredAt, profile.timezone));

  const payload = {
    user: userId,
    type: "mood",
    localDate,
    occurredAt,
    mood: input.mood !== undefined && input.mood !== null ? Math.min(5, Math.max(1, Number(input.mood))) : null,
    energy: input.energy !== undefined && input.energy !== null ? Math.min(5, Math.max(1, Number(input.energy))) : null,
    stress: input.stress !== undefined && input.stress !== null ? Math.min(5, Math.max(1, Number(input.stress))) : null,
    focus: input.focus !== undefined && input.focus !== null ? Math.min(5, Math.max(1, Number(input.focus))) : null,
    motivation: input.motivation !== undefined && input.motivation !== null ? Math.min(5, Math.max(1, Number(input.motivation))) : null,
    emotions: Array.isArray(input.emotions) ? input.emotions.slice(0, 30) : [],
    contextTags: Array.isArray(input.contextTags) ? input.contextTags.slice(0, 30) : [],
    note: input.note || "",
    source: input.source || { type: "manual" },
    dedupeKey: input.dedupeKey || undefined,
  };

  return LifeHealthEntry.create(payload);
};

const listMindEntries = async (userId, query = {}) => {
  const filter = { type: "mood" };
  if (query.start || query.end) {
    filter.localDate = {
      ...(query.start ? { $gte: query.start } : {}),
      ...(query.end ? { $lte: query.end } : {}),
    };
  }
  return listOwned(LifeHealthEntry, userId, filter, query, { occurredAt: -1 });
};

const mindSummary = async (userId, query = {}) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const end = assertDateKey(query.end || localDateKey(new Date(), profile.timezone));
  const entries = await LifeHealthEntry.find({
    user: userId,
    type: "mood",
    deletedAt: null,
    localDate: { $lte: end },
  }).sort({ occurredAt: -1 }).limit(90).lean();

  const validMoods = entries.filter((e) => e.mood !== null);
  const avgMood = validMoods.length ? Number((validMoods.reduce((s, e) => s + e.mood, 0) / validMoods.length).toFixed(1)) : null;
  const validEnergy = entries.filter((e) => e.energy !== null);
  const avgEnergy = validEnergy.length ? Number((validEnergy.reduce((s, e) => s + e.energy, 0) / validEnergy.length).toFixed(1)) : null;
  const validStress = entries.filter((e) => e.stress !== null);
  const avgStress = validStress.length ? Number((validStress.reduce((s, e) => s + e.stress, 0) / validStress.length).toFixed(1)) : null;

  const emotionCounts = {};
  entries.forEach((e) => {
    (e.emotions || []).forEach((tag) => {
      emotionCounts[tag] = (emotionCounts[tag] || 0) + 1;
    });
  });

  const contextCounts = {};
  entries.forEach((e) => {
    (e.contextTags || []).forEach((tag) => {
      contextCounts[tag] = (contextCounts[tag] || 0) + 1;
    });
  });

  return {
    averages: {
      mood: avgMood,
      energy: avgEnergy,
      stress: avgStress,
    },
    emotionDistribution: emotionCounts,
    contextDistribution: contextCounts,
    totalEntries: entries.length,
    recentEntries: entries.slice(0, 30),
  };
};

// ==========================================
// 6. LIFE SIGNALS (DETERMINISTIC, 0-100)
// ==========================================

const computeLifeSignals = async (userId, dateKey) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const targetSleepMinutes = profile.sleepTargetMinutes || 480;

  const [sleepSession, workouts, events, mindEntries] = await Promise.all([
    LifeSleepSession.findOne({ user: userId, localDate: dateKey, sessionType: "main", deletedAt: null }).lean(),
    LifeWorkoutSession.find({ user: userId, localDate: dateKey, deletedAt: null }).lean(),
    LifeEvent.find({ user: userId, scheduledDate: dateKey }).lean(),
    LifeHealthEntry.find({ user: userId, localDate: dateKey, type: "mood", deletedAt: null }).lean(),
  ]);

  // 1. Sleep Signal
  let sleepSignal = { score: null, dataAvailable: false, explanation: "Not enough data yet" };
  if (sleepSession && sleepSession.durationMinutes > 0) {
    const durationAttainment = Math.min(100, Math.round((sleepSession.durationMinutes / targetSleepMinutes) * 100));
    const qualityFactor = sleepSession.quality ? sleepSession.quality * 20 : 70;
    const score = Math.round(durationAttainment * 0.6 + qualityFactor * 0.4);
    sleepSignal = {
      score: Math.min(100, Math.max(0, score)),
      dataAvailable: true,
      formula: "Duration attainment vs target (60%) + self-reported sleep quality (40%)",
      explanation: `Recorded ${Math.floor(sleepSession.durationMinutes / 60)}h ${sleepSession.durationMinutes % 60}m sleep with quality ${sleepSession.quality || "unrated"}/5.`,
    };
  }

  // 2. Activity Signal
  let activitySignal = { score: null, dataAvailable: false, explanation: "Not enough data yet" };
  const totalWorkoutMins = workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0);
  if (workouts.length > 0 || totalWorkoutMins > 0) {
    const score = Math.min(100, Math.round((totalWorkoutMins / 30) * 100));
    activitySignal = {
      score,
      dataAvailable: true,
      formula: "Recorded workout minutes against 30-minute daily activity target",
      explanation: `Logged ${totalWorkoutMins} active minutes across ${workouts.length} session(s).`,
    };
  }

  // 3. Consistency Signal (Habits)
  let consistencySignal = { score: null, dataAvailable: false, explanation: "Not enough data yet" };
  if (events.length > 0) {
    const completed = events.filter((e) => e.status === "completed").length;
    const score = Math.round((completed / events.length) * 100);
    consistencySignal = {
      score,
      dataAvailable: true,
      formula: "Percentage of scheduled actions & habits marked completed",
      explanation: `${completed} of ${events.length} planned items completed.`,
    };
  }

  // 4. Mind Signal
  let mindSignal = { score: null, dataAvailable: false, explanation: "Not enough data yet" };
  if (mindEntries.length > 0) {
    const latestMind = mindEntries[mindEntries.length - 1];
    const moodScore = latestMind.mood ? latestMind.mood * 20 : 60;
    const energyScore = latestMind.energy ? latestMind.energy * 20 : 60;
    const stressInverted = latestMind.stress ? (6 - latestMind.stress) * 20 : 60;
    const score = Math.round((moodScore + energyScore + stressInverted) / 3);
    mindSignal = {
      score,
      dataAvailable: true,
      formula: "Average of mood (1-5), energy (1-5), and inverted stress (1-5)",
      explanation: `Mood ${latestMind.mood || "-"}/5, Energy ${latestMind.energy || "-"}/5, Stress ${latestMind.stress || "-"}/5. Non-clinical wellness indicator.`,
    };
  }

  return {
    sleep: sleepSignal,
    activity: activitySignal,
    consistency: consistencySignal,
    mind: mindSignal,
  };
};

const generateMorningBrief = async (userId, dateKey) => {
  const [sleep, tasks, bills] = await Promise.all([
    LifeSleepSession.findOne({ user: userId, localDate: dateKey, sessionType: "main", deletedAt: null }).lean(),
    LifeTask.find({ user: userId, localDate: dateKey, status: "active" }).lean(),
    LifeFinancePlan.find({ user: userId, type: { $in: ["bill", "subscription"] }, status: "active", dueDate: dateKey }).lean(),
  ]);

  const parts = [];
  if (sleep && sleep.durationMinutes) {
    const hours = Math.floor(sleep.durationMinutes / 60);
    const mins = sleep.durationMinutes % 60;
    parts.push(`You slept ${hours}h ${mins}m`);
  }
  if (tasks.length > 0) {
    parts.push(`have ${tasks.length} scheduled action${tasks.length === 1 ? "" : "s"}`);
  }
  if (bills.length > 0) {
    parts.push(`${bills.length} bill${bills.length === 1 ? "" : "s"} due today`);
  }

  if (parts.length === 0) {
    return "Good morning. Ready to start your day.";
  }
  return `Good morning. ${parts.join(", ")}.`;
};

module.exports = {
  createBodyEntry,
  listBodyEntries,
  deleteBodyEntry,
  bodySummary,
  listVitals,
  createSleepSession,
  listSleepSessions,
  deleteSleepSession,
  sleepAnalytics,
  createWorkoutSession,
  listWorkoutSessions,
  deleteWorkoutSession,
  fitnessSummary,
  strengthVolumeAnalytics,
  createNutritionEntry,
  listNutritionEntries,
  deleteNutritionEntry,
  nutritionSummary,
  createMindEntry,
  listMindEntries,
  mindSummary,
  computeLifeSignals,
  generateMorningBrief,
};
