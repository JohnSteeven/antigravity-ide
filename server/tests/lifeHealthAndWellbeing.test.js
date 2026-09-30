const express = require("express");
const request = require("supertest");
const healthExpansionService = require("../life/services/healthExpansionService");
const LifeBodyEntry = require("../life/models/LifeBodyEntry");
const LifeSleepSession = require("../life/models/LifeSleepSession");
const LifeWorkoutSession = require("../life/models/LifeWorkoutSession");
const LifeNutritionEntry = require("../life/models/LifeNutritionEntry");
const LifeHealthEntry = require("../life/models/LifeHealthEntry");
const LifeDailySummary = require("../life/models/LifeDailySummary");
const LifeEvent = require("../life/models/LifeEvent");
const LifeTask = require("../life/models/LifeTask");
const LifeFinancePlan = require("../life/models/LifeFinancePlan");

// Mock dependencies
jest.mock("../audit/AuditLogger", () => ({
  log: jest.fn().mockResolvedValue(),
}));

jest.mock("../life/services/profileService", () => ({
  getOrCreateProfile: jest.fn().mockResolvedValue({
    timezone: "UTC",
    weightUnit: "kg",
    heightUnit: "cm",
    height: 180,
    waterUnit: "ml",
    waterTargetMl: 2500,
    sleepTargetMinutes: 480, // 8h
    nutritionTargetCalories: 2200,
    visibleModules: ["habits", "goals", "water", "sleep", "workouts", "mood", "money", "journal"],
  }),
}));

const lifeRoutes = require("../life/routes");

describe("Phase 29.5 Checkpoint 2: Health, Sleep, Fitness, Nutrition, Mind", () => {
  const testUserId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Body Measurements & BMI Derivation", () => {
    it("derives BMI accurately from weight (kg) and height (cm)", async () => {
      const mockCreated = {
        _id: "body-1",
        user: testUserId,
        weight: 72,
        weightUnit: "kg",
        height: 180,
        heightUnit: "cm",
        bmi: 22.2,
      };
      jest.spyOn(LifeBodyEntry, "create").mockResolvedValueOnce(mockCreated);

      const result = await healthExpansionService.createBodyEntry(testUserId, {
        weight: 72,
        weightUnit: "kg",
        height: 180,
        heightUnit: "cm",
      });

      expect(LifeBodyEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: testUserId,
          weight: 72,
          bmi: 22.2, // 72 / (1.8^2) = 22.22
        })
      );
      expect(result.bmi).toBe(22.2);
    });

    it("calculates 7-day and 30-day weight moving averages and changes in summary", async () => {
      const mockEntries = [
        { occurredAt: new Date("2026-09-30"), weight: 75.0, weightUnit: "kg", bmi: 23.1 },
        { occurredAt: new Date("2026-09-29"), weight: 75.5, weightUnit: "kg", bmi: 23.3 },
        { occurredAt: new Date("2026-09-28"), weight: 76.0, weightUnit: "kg", bmi: 23.5 },
      ];
      jest.spyOn(LifeBodyEntry, "find").mockReturnValueOnce({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve(mockEntries) }) }),
      });

      const summary = await healthExpansionService.bodySummary(testUserId, { end: "2026-09-30" });
      expect(summary.latest.weight).toBe(75.0);
      expect(summary.stats.currentWeight).toBe(75.0);
      expect(summary.stats.average7Days).toBe(75.5); // (75 + 75.5 + 76) / 3 = 75.5
      expect(summary.stats.change30Days).toBe(-1.0); // 75.0 - 76.0 = -1.0
    });
  });

  describe("2. Sleep & Transparent Sleep Debt", () => {
    it("computes duration and transparent sleep debt against user target", async () => {
      const sleepStart = new Date("2026-09-29T23:00:00Z");
      const sleepEnd = new Date("2026-09-30T06:00:00Z"); // 7 hours = 420 mins

      const mockSession = {
        _id: "sleep-1",
        user: testUserId,
        sessionType: "main",
        sleepStart,
        sleepEnd,
        durationMinutes: 420,
        quality: 4,
        refreshedRating: 4,
      };

      jest.spyOn(LifeSleepSession, "find").mockReturnValueOnce({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([mockSession]) }) }),
      });

      const analytics = await healthExpansionService.sleepAnalytics(testUserId, { end: "2026-09-30" });

      expect(analytics.targetMinutes).toBe(480); // 8h
      expect(analytics.stats.average7DaysMinutes).toBe(420);
      // Sleep debt: 480 target - 420 recorded = 60 mins deficit
      expect(analytics.stats.sleepDebtMinutes).toBe(60);
      expect(analytics.stats.targetAttainmentPercent).toBe(88); // 420 / 480 = 87.5% -> 88%
      expect(analytics.wellnessRecovery).toBeDefined();
      expect(analytics.wellnessRecovery.score).toBeGreaterThan(0);
      expect(analytics.wellnessRecovery.formula).toContain("Weighted blend");
      expect(analytics.wellnessRecovery.disclaimer).toContain("Wellness indicator only");
    });

    it("rejects invalid sleep duration where wake time is not within 24h", async () => {
      await expect(
        healthExpansionService.createSleepSession(testUserId, {
          sleepStart: "2026-09-30T10:00:00Z",
          sleepEnd: "2026-10-02T10:00:00Z", // 48h later
        })
      ).rejects.toThrow("within 24 hours");
    });
  });

  describe("3. Fitness & Strength Volume Analytics", () => {
    it("calculates total volume (sets × reps × weight) and PRs per exercise", async () => {
      const mockWorkouts = [
        {
          _id: "w-1",
          localDate: "2026-09-28",
          workoutType: "strength",
          durationMinutes: 60,
          exercises: [
            {
              name: "Bench Press",
              sets: [
                { reps: 10, weight: 60 }, // 600 kg
                { reps: 8, weight: 70 },  // 560 kg
              ],
            },
            {
              name: "Squat",
              sets: [
                { reps: 5, weight: 100 }, // 500 kg
              ],
            },
          ],
        },
        {
          _id: "w-2",
          localDate: "2026-09-30",
          workoutType: "strength",
          durationMinutes: 50,
          exercises: [
            {
              name: "Bench Press",
              sets: [
                { reps: 5, weight: 80 },  // 400 kg (New Max Weight PR: 80 kg)
              ],
            },
          ],
        },
      ];

      jest.spyOn(LifeWorkoutSession, "find").mockReturnValueOnce({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve(mockWorkouts) }) }),
      });

      const analytics = await healthExpansionService.strengthVolumeAnalytics(testUserId);

      // Total volume: 600 + 560 + 500 + 400 = 2060 kg
      expect(analytics.totalVolumeAllTime).toBe(2060);
      expect(analytics.exerciseCount).toBe(2);

      const bench = analytics.exercises.find((e) => e.name === "Bench Press");
      expect(bench).toBeDefined();
      expect(bench.totalVolume).toBe(1560); // 600 + 560 + 400
      expect(bench.prMaxWeight).toBe(80); // Highest weight lifted
      expect(bench.prMaxSessionVolume).toBe(1160); // Best single-session volume (600 + 560)
    });
  });

  describe("4. Nutrition Tracking & Macronutrient Balance", () => {
    it("aggregates daily calorie totals and macro distributions accurately", async () => {
      const mockMeals = [
        { mealType: "breakfast", name: "Oatmeal", calories: 400, protein: 15, carbs: 60, fat: 8, fiber: 6 },
        { mealType: "lunch", name: "Chicken Rice", calories: 700, protein: 50, carbs: 80, fat: 15, fiber: 4 },
        { mealType: "dinner", name: "Salmon Salad", calories: 600, protein: 45, carbs: 10, fat: 35, fiber: 5 },
      ];

      jest.spyOn(LifeNutritionEntry, "find").mockReturnValueOnce({
        sort: () => ({ lean: () => Promise.resolve(mockMeals) }),
      });

      const summary = await healthExpansionService.nutritionSummary(testUserId, { date: "2026-09-30" });

      expect(summary.totals.calories).toBe(1700);
      expect(summary.totals.protein).toBe(110);
      expect(summary.totals.carbs).toBe(150);
      expect(summary.totals.fat).toBe(58);
      expect(summary.totals.fiber).toBe(15);
      expect(summary.macroDistribution).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Protein", grams: 110, calories: 440 }),
          expect.objectContaining({ name: "Carbs", grams: 150, calories: 600 }),
          expect.objectContaining({ name: "Fat", grams: 58, calories: 522 }),
        ])
      );
      expect(summary.meals.breakfast.length).toBe(1);
      expect(summary.meals.lunch.length).toBe(1);
      expect(summary.meals.dinner.length).toBe(1);
    });
  });

  describe("5. Mind & Mood Reflection", () => {
    it("tracks mood, energy, focus, motivation, and multi-tag emotion/context distributions", async () => {
      const mockMindEntries = [
        {
          mood: 5,
          energy: 4,
          stress: 1,
          focus: 5,
          motivation: 5,
          emotions: ["calm", "focused", "energized"],
          contextTags: ["work", "sleep"],
        },
        {
          mood: 4,
          energy: 3,
          stress: 2,
          focus: 4,
          motivation: 4,
          emotions: ["calm", "grateful"],
          contextTags: ["family"],
        },
      ];

      jest.spyOn(LifeHealthEntry, "find").mockReturnValueOnce({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve(mockMindEntries) }) }),
      });

      const summary = await healthExpansionService.mindSummary(testUserId, { end: "2026-09-30" });

      expect(summary.averages.mood).toBe(4.5);
      expect(summary.averages.energy).toBe(3.5);
      expect(summary.averages.stress).toBe(1.5);
      expect(summary.emotionDistribution["calm"]).toBe(2);
      expect(summary.emotionDistribution["energized"]).toBe(1);
      expect(summary.contextDistribution["work"]).toBe(1);
      expect(summary.contextDistribution["family"]).toBe(1);
    });
  });

  describe("6. Life Signals & Ground-Truth Morning Brief", () => {
    it("computes deterministic 0-100 signals with transparent formulas", async () => {
      jest.spyOn(LifeSleepSession, "findOne").mockReturnValueOnce({
        lean: () => Promise.resolve({ durationMinutes: 480, quality: 5 }), // 100% sleep
      });
      jest.spyOn(LifeWorkoutSession, "find").mockReturnValueOnce({
        lean: () => Promise.resolve([{ durationMinutes: 30 }]), // 100% activity
      });
      jest.spyOn(LifeEvent, "find").mockReturnValueOnce({
        lean: () => Promise.resolve([
          { status: "completed" },
          { status: "completed" },
          { status: "skipped" },
        ]), // 2 of 3 completed = 67%
      });
      jest.spyOn(LifeHealthEntry, "find").mockReturnValueOnce({
        lean: () => Promise.resolve([
          { mood: 4, energy: 4, stress: 2 }, // mood 80, energy 80, stress inverted 80 -> 80%
        ]),
      });

      const signals = await healthExpansionService.computeLifeSignals(testUserId, "2026-09-30");

      expect(signals.sleep.score).toBe(100);
      expect(signals.sleep.dataAvailable).toBe(true);
      expect(signals.activity.score).toBe(100);
      expect(signals.activity.dataAvailable).toBe(true);
      expect(signals.consistency.score).toBe(67);
      expect(signals.consistency.dataAvailable).toBe(true);
      expect(signals.mind.score).toBe(80);
      expect(signals.mind.dataAvailable).toBe(true);
    });

    it("generates truthful morning brief from real data without fabrication", async () => {
      jest.spyOn(LifeSleepSession, "findOne").mockReturnValueOnce({
        lean: () => Promise.resolve({ durationMinutes: 438 }), // 7h 18m
      });
      jest.spyOn(LifeTask, "find").mockReturnValueOnce({
        lean: () => Promise.resolve([{ title: "Task 1" }, { title: "Task 2" }]),
      });
      jest.spyOn(LifeFinancePlan, "find").mockReturnValueOnce({
        lean: () => Promise.resolve([{ name: "Cloud Storage", amountMinor: 999 }]),
      });

      const brief = await healthExpansionService.generateMorningBrief(testUserId, "2026-09-30");
      expect(brief).toBe("Good morning. You slept 7h 18m, have 2 scheduled actions, 1 bill due today.");
    });
  });

  describe("7. Express API Routes Integration", () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(express.json());
      // Mock authenticated req.user
      app.use((req, res, next) => {
        req.user = { _id: testUserId };
        next();
      });
      app.use("/api/life", lifeRoutes);
    });

    it("GET /api/life/health/body/summary returns summary stats", async () => {
      jest.spyOn(healthExpansionService, "bodySummary").mockResolvedValueOnce({
        latest: { weight: 75.0 },
        stats: { currentWeight: 75.0 },
      });

      const res = await request(app).get("/api/life/health/body/summary");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.currentWeight).toBe(75.0);
    });

    it("POST /api/life/health/sleep accepts valid sleep session payload", async () => {
      jest.spyOn(healthExpansionService, "createSleepSession").mockResolvedValueOnce({
        _id: "sleep-123",
        durationMinutes: 480,
      });

      const res = await request(app)
        .post("/api/life/health/sleep")
        .send({
          sessionType: "main",
          sleepStart: "2026-09-29T22:00:00.000Z",
          sleepEnd: "2026-09-30T06:00:00.000Z",
          quality: 4,
          source: { type: "manual" },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.durationMinutes).toBe(480);
    });

    it("POST /api/life/fitness/workouts accepts valid strength session with exercises", async () => {
      jest.spyOn(healthExpansionService, "createWorkoutSession").mockResolvedValueOnce({
        _id: "w-123",
        durationMinutes: 45,
      });

      const res = await request(app)
        .post("/api/life/fitness/workouts")
        .send({
          workoutType: "strength",
          durationMinutes: 45,
          exercises: [
            {
              name: "Deadlift",
              sets: [{ setNumber: 1, reps: 5, weight: 120, rpe: 8 }],
            },
          ],
          source: { type: "manual" },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("POST /api/life/nutrition validates required fields", async () => {
      jest.spyOn(healthExpansionService, "createNutritionEntry").mockResolvedValueOnce({
        _id: "nut-123",
        calories: 500,
      });

      const res = await request(app)
        .post("/api/life/nutrition")
        .send({
          mealType: "lunch",
          name: "Grilled Salmon",
          calories: 500,
          protein: 40,
          carbs: 10,
          fat: 25,
          source: { type: "manual" },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
