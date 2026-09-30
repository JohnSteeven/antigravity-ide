const mongoose = require("mongoose");
const LifeBodyEntry = require("../life/models/LifeBodyEntry");
const LifeSleepSession = require("../life/models/LifeSleepSession");
const LifeWorkoutSession = require("../life/models/LifeWorkoutSession");
const LifeNutritionEntry = require("../life/models/LifeNutritionEntry");
const LifeFinanceAccount = require("../life/models/LifeFinanceAccount");
const LifeDailySummary = require("../life/models/LifeDailySummary");
const { EXPORT_MODELS } = require("../life/services/privacyService");
const migration016 = require("../migrations/016-life-premium-expansion");
const validators = require("../life/validators/lifeValidators");

describe("Life Data Foundation (Phase 29.5A)", () => {
  const mockUserId = new mongoose.Types.ObjectId();

  describe("Privacy & Data Export Registry", () => {
    it("registers all new additive models in EXPORT_MODELS", () => {
      expect(EXPORT_MODELS.body).toBe(LifeBodyEntry);
      expect(EXPORT_MODELS.sleepSessions).toBe(LifeSleepSession);
      expect(EXPORT_MODELS.workouts).toBe(LifeWorkoutSession);
      expect(EXPORT_MODELS.nutrition).toBe(LifeNutritionEntry);
      expect(EXPORT_MODELS.financeAccounts).toBe(LifeFinanceAccount);
      expect(EXPORT_MODELS.dailySummaries).toBe(LifeDailySummary);
    });
  });

  describe("Migration 016 Indexes", () => {
    it("defines valid compound indexes for scaling 5+ years of data", () => {
      expect(migration016.indexes.lifebodyentries).toBeDefined();
      expect(migration016.indexes.lifesleepsessions).toBeDefined();
      expect(migration016.indexes.lifeworkoutsessions).toBeDefined();
      expect(migration016.indexes.lifenutritionentries).toBeDefined();
      expect(migration016.indexes.lifefinanceaccounts).toBeDefined();
      expect(migration016.indexes.lifedailysummaries).toBeDefined();

      const dailySummaryUnique = migration016.indexes.lifedailysummaries.find(
        ([idx, opts]) => idx.user === 1 && idx.localDate === 1 && opts.unique
      );
      expect(dailySummaryUnique).toBeDefined();
    });
  });

  describe("LifeBodyEntry", () => {
    it("derives BMI from weight and height in kg and cm", async () => {
      const entry = new LifeBodyEntry({
        user: mockUserId,
        localDate: "2026-09-30",
        weight: 70,
        weightUnit: "kg",
        height: 175,
        heightUnit: "cm",
      });
      await entry.validate();
      await new Promise((resolve) => entry.schema.s.hooks.execPre("save", entry, resolve));
      expect(entry.bmi).toBe(22.9);
    });

    it("derives BMI from weight in lb and height in inches", async () => {
      const entry = new LifeBodyEntry({
        user: mockUserId,
        localDate: "2026-09-30",
        weight: 154.32,
        weightUnit: "lb",
        height: 68.9,
        heightUnit: "in",
      });
      await new Promise((resolve) => entry.schema.s.hooks.execPre("save", entry, resolve));
      expect(entry.bmi).toBeCloseTo(22.9, 0);
    });

    it("supports source provenance for wearable, phone, or manual", () => {
      const entry = new LifeBodyEntry({
        user: mockUserId,
        localDate: "2026-09-30",
        vitals: { restingHeartRate: 58, systolicBp: 118, diastolicBp: 78, spo2: 98 },
        source: { type: "wearable", provider: "apple_health" },
      });
      expect(entry.source.type).toBe("wearable");
      expect(entry.source.provider).toBe("apple_health");
      expect(entry.vitals.restingHeartRate).toBe(58);
    });

    it("validates bodyEntry schema via Zod", () => {
      const parsed = validators.bodyEntry.safeParse({
        localDate: "2026-09-30",
        weight: "72.5",
        vitals: {
          restingHeartRate: "62",
          systolicBp: "120",
          diastolicBp: "80",
        },
      });
      expect(parsed.success).toBe(true);
      expect(parsed.data.weight).toBe(72.5);
      expect(parsed.data.vitals.restingHeartRate).toBe(62);
    });
  });

  describe("LifeSleepSession", () => {
    it("auto-calculates durationMinutes from sleepStart and sleepEnd", async () => {
      const start = new Date("2026-09-29T23:00:00Z");
      const end = new Date("2026-09-30T07:15:00Z");
      const session = new LifeSleepSession({
        user: mockUserId,
        localDate: "2026-09-30",
        sessionType: "main",
        sleepStart: start,
        sleepEnd: end,
      });
      await session.validate();
      expect(session.durationMinutes).toBe(495);
    });

    it("supports sleep session validation with stages and quality", () => {
      const parsed = validators.sleepSession.safeParse({
        localDate: "2026-09-30",
        sessionType: "main",
        sleepStart: "2026-09-29T23:00:00.000Z",
        sleepEnd: "2026-09-30T07:00:00.000Z",
        quality: 4,
        deepMinutes: 90,
        remMinutes: 110,
        lightMinutes: 240,
        awakeMinutes: 40,
      });
      expect(parsed.success).toBe(true);
      expect(parsed.data.quality).toBe(4);
      expect(parsed.data.deepMinutes).toBe(90);
    });
  });

  describe("LifeWorkoutSession", () => {
    it("validates strength workout sessions with exercises and sets", () => {
      const parsed = validators.workoutSession.safeParse({
        localDate: "2026-09-30",
        workoutType: "strength",
        title: "Upper Body Hypertrophy",
        durationMinutes: 55,
        effort: 8,
        exercises: [
          {
            name: "Bench Press",
            sets: [
              { setNumber: 1, reps: 10, weight: 60, weightUnit: "kg", rpe: 7 },
              { setNumber: 2, reps: 8, weight: 70, weightUnit: "kg", rpe: 8.5 },
            ],
          },
        ],
      });
      expect(parsed.success).toBe(true);
      expect(parsed.data.exercises[0].sets.length).toBe(2);
      expect(parsed.data.exercises[0].sets[1].weight).toBe(70);
    });
  });

  describe("LifeNutritionEntry", () => {
    it("keeps unknown macros as null when only calories are logged", () => {
      const parsed = validators.nutritionEntry.safeParse({
        localDate: "2026-09-30",
        mealType: "lunch",
        name: "Quick Sandwich",
        calories: 450,
      });
      expect(parsed.success).toBe(true);
      expect(parsed.data.calories).toBe(450);
      expect(parsed.data.protein).toBeUndefined();
      expect(parsed.data.carbs).toBeUndefined();
    });

    it("stores macro breakdowns accurately when provided", () => {
      const parsed = validators.nutritionEntry.safeParse({
        localDate: "2026-09-30",
        mealType: "breakfast",
        name: "Oatmeal with Whey & Berries",
        calories: 420,
        protein: 35,
        carbs: 52,
        fat: 8,
        fiber: 7,
      });
      expect(parsed.success).toBe(true);
      expect(parsed.data.protein).toBe(35);
      expect(parsed.data.carbs).toBe(52);
    });
  });

  describe("LifeDailySummary", () => {
    it("holds deterministic daily signals and domain aggregates", () => {
      const summary = new LifeDailySummary({
        user: mockUserId,
        localDate: "2026-09-30",
        waterMl: 2500,
        sleepMinutes: 460,
        sleepQuality: 4,
        workoutMinutes: 45,
        activeCalories: 380,
        habitsPlanned: 5,
        habitsCompleted: 4,
        signals: {
          sleep: 85,
          activity: 78,
          consistency: 80,
          mind: 75,
          goals: 70,
        },
      });
      expect(summary.signals.sleep).toBe(85);
      expect(summary.waterMl).toBe(2500);
      expect(summary.habitsCompleted).toBe(4);
    });
  });
});
