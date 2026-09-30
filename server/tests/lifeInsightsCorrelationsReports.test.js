const express = require("express");
const request = require("supertest");
const correlationService = require("../life/services/correlationService");
const reportService = require("../life/services/reportService");
const reminderEngine = require("../life/services/reminderEngine");
const profileService = require("../life/services/profileService");
const insightService = require("../life/services/insightService");
const lifeAiService = require("../life/services/lifeAiService");
const AIProviderService = require("../services/aiProviderService");
const LifeDailySummary = require("../life/models/LifeDailySummary");
const LifeSleepSession = require("../life/models/LifeSleepSession");
const LifeWorkoutSession = require("../life/models/LifeWorkoutSession");
const LifeFinanceEntry = require("../life/models/LifeFinanceEntry");
const LifeHealthEntry = require("../life/models/LifeHealthEntry");
const LifeEvent = require("../life/models/LifeEvent");
const LifeGoal = require("../life/models/LifeGoal");
const LifeJournalEntry = require("../life/models/LifeJournalEntry");

jest.mock("../life/services/profileService");
jest.mock("../services/aiProviderService");

describe("Phase 29.5 Checkpoint 4: Insights, Correlations, Reports, Smart Reminders, and Journey AI", () => {
  const mockUserId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();

    profileService.getOrCreateProfile.mockResolvedValue({
      _id: "profile_123",
      user: mockUserId,
      timezone: "UTC",
      currency: "USD",
      notifications: {
        enabled: true,
        quietHours: { enabled: true, start: "22:00", end: "07:00" },
        dailyCap: 5,
      },
      vacationMode: { enabled: false },
      aiInsightsEnabled: true,
      aiReview: {
        includeHealth: false,
        includeFinance: false,
        includeJournal: false,
      }
    });

    const mockQuery = (data = []) => ({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(data),
    });

    jest.spyOn(LifeEvent, "find").mockReturnValue(mockQuery([]));
    jest.spyOn(LifeHealthEntry, "find").mockReturnValue(mockQuery([]));
    jest.spyOn(LifeFinanceEntry, "find").mockReturnValue(mockQuery([]));
    jest.spyOn(LifeGoal, "find").mockReturnValue(mockQuery([]));
    jest.spyOn(LifeJournalEntry, "find").mockReturnValue(mockQuery([]));
    jest.spyOn(LifeDailySummary, "find").mockReturnValue(mockQuery([]));
    jest.spyOn(LifeSleepSession, "find").mockReturnValue(mockQuery([]));
    jest.spyOn(LifeWorkoutSession, "find").mockReturnValue(mockQuery([]));

    jest.spyOn(insightService, "buildInsights").mockResolvedValue({
      start: "2026-09-28",
      end: "2026-10-04",
      metrics: { planned: 10, completed: 8, consistency: 80 },
      insights: [],
      languageBoundary: "Not clinical"
    });
  });

  describe("1. Empirical Correlation Engine (Pearson Continuous & Spearman Ordinal)", () => {
    test("computes Pearson correlation correctly for continuous-continuous paired data", () => {
      // Continuous linear relationship (e.g. workout minutes vs sleep hours)
      const continuousPairs = [
        [30, 6.5],
        [45, 7.0],
        [60, 7.5],
        [75, 8.0],
        [90, 8.5],
        [105, 9.0],
        [120, 9.5],
      ];
      const result = correlationService.calculatePearson(continuousPairs);
      expect(result.method).toBe("pearson");
      expect(result.insufficientData).toBe(false);
      expect(result.sampleSize).toBe(7);
      expect(result.r).toBeCloseTo(1.0, 1);
      expect(result.strength).toBe("strong_positive");
      expect(result.disclaimer).toContain("Association does not establish causation");
    });

    test("computes Spearman rank correlation for ordinal ratings (mood/energy 1-5)", () => {
      // Ordinal discrete rating pairs (e.g. mood 1-5 vs energy 1-5)
      const ordinalPairs = [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [4, 4],
        [5, 5],
        [5, 5],
      ];
      const result = correlationService.calculateSpearman(ordinalPairs);
      expect(result.method).toBe("spearman");
      expect(result.insufficientData).toBe(false);
      expect(result.sampleSize).toBe(7);
      expect(result.r).toBeCloseTo(1.0, 1);
      expect(result.strength).toBe("strong_positive");
      expect(result.disclaimer).toContain("Association does not establish causation");
    });

    test("computes Spearman rank correlation correctly with tied ranks", () => {
      // Values with heavy ties: fractional ranks must be applied correctly
      const tiedPairs = [
        [10, 2],
        [20, 2], // tie on Y
        [20, 3], // tie on X
        [30, 4],
        [30, 4], // tie on both
        [40, 5],
        [50, 5], // tie on Y
      ];
      const result = correlationService.calculateSpearman(tiedPairs);
      expect(result.method).toBe("spearman");
      expect(result.insufficientData).toBe(false);
      expect(result.sampleSize).toBe(7);
      expect(typeof result.r).toBe("number");
      expect(result.r).toBeGreaterThan(0.9);
      expect(result.strength).toBe("strong_positive");
    });

    test("computes negative (inverse) correlation correctly", () => {
      // Inverse relationship: as X increases, Y decreases
      const inversePairs = [
        [100, 5],
        [200, 4],
        [300, 3],
        [400, 2],
        [500, 1],
        [600, 1],
        [700, 1],
      ];
      const result = correlationService.calculateSpearman(inversePairs);
      expect(result.r).toBeLessThan(-0.8);
      expect(result.strength).toBe("strong_negative");
      expect(result.description).toContain("Inverse rank correlation");
    });

    test("handles constant series (zero variance) gracefully without division by zero", () => {
      const constantPairs = [
        [5, 50],
        [5, 50],
        [5, 50],
        [5, 50],
        [5, 50],
        [5, 50],
        [5, 50],
      ];
      const pearsonResult = correlationService.calculatePearson(constantPairs);
      expect(pearsonResult.insufficientData).toBe(false);
      expect(pearsonResult.r).toBe(0);
      expect(pearsonResult.strength).toBe("neutral_or_weak");

      const spearmanResult = correlationService.calculateSpearman(constantPairs);
      expect(spearmanResult.insufficientData).toBe(false);
      expect(spearmanResult.r).toBe(0);
      expect(spearmanResult.strength).toBe("neutral_or_weak");
    });

    test("returns insufficientData when sample size is below required minimum (N < 7)", () => {
      const smallPairs = [
        [7, 70],
        [8, 80],
        [6, 60],
      ];
      const result = correlationService.calculatePearson(smallPairs);
      expect(result.insufficientData).toBe(true);
      expect(result.sampleSize).toBe(3);
      expect(result.requiredMin).toBe(7);
      expect(result.r).toBeNull();
      expect(result.strength).toBe("insufficient_data");
    });

    test("safely handles missing data and null/undefined/NaN values", () => {
      const dirtyPairs = [
        [1, 10],
        [null, 20],
        [2, undefined],
        [3, NaN],
        [4, 40],
        [5, 50],
        [6, 60],
        [7, 70],
        [8, 80],
        [9, 90],
      ];
      const result = correlationService.calculatePearson(dirtyPairs);
      expect(result.sampleSize).toBe(7); // only 7 clean pairs
      expect(result.insufficientData).toBe(false);
      expect(result.r).toBeCloseTo(1.0, 1);
    });
  });

  describe("2. Periodic Reports Synthesis (Weekly, Monthly & Yearly)", () => {
    test("builds weekly report with dimension scorecards and period-over-period deltas", async () => {
      const mockQuery = (data = []) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(data),
      });

      jest.spyOn(LifeEvent, "find").mockReturnValue(mockQuery([
        { itemType: "habit", itemId: "h1", scheduledDate: "2026-09-28", status: "completed", occurredAt: new Date() },
        { itemType: "habit", itemId: "h2", scheduledDate: "2026-09-29", status: "completed", occurredAt: new Date() },
      ]));

      jest.spyOn(LifeHealthEntry, "find").mockReturnValue(mockQuery([
        { type: "sleep", durationMinutes: 480, localDate: "2026-09-28" },
        { type: "sleep", durationMinutes: 450, localDate: "2026-09-29" },
        { type: "workout", durationMinutes: 45, localDate: "2026-09-28" },
        { type: "workout", durationMinutes: 60, localDate: "2026-09-30" },
      ]));

      jest.spyOn(LifeFinanceEntry, "find").mockReturnValue(mockQuery([
        { type: "income", amountMinor: 50000, currency: "USD", localDate: "2026-09-28" },
        { type: "expense", amountMinor: 20000, currency: "USD", category: "groceries", localDate: "2026-09-29" },
      ]));

      jest.spyOn(LifeGoal, "find").mockReturnValue(mockQuery([
        { _id: "g1", title: "Run 10K", status: "active", manualProgress: 60 }
      ]));

      const report = await reportService.buildPeriodicReport(mockUserId, {
        type: "weekly",
        date: "2026-10-01"
      });

      expect(report.type).toBe("weekly");
      expect(report.period).toBeDefined();
      expect(report.scorecards).toBeDefined();
      expect(report.scorecards.rhythm).toBeDefined();
      expect(report.scorecards.sleep).toBeDefined();
      expect(report.scorecards.movement).toBeDefined();
      expect(report.scorecards.financial).toBeDefined();
      expect(report.languageBoundary).toContain("Not clinical");
    });

    test("builds yearly report with 12-month trends, separated currency totals, body progression, and privacy-preserving journal metrics", async () => {
      const mockQuery = (data = []) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(data),
      });

      // Mock habit events across multiple months in 2026
      jest.spyOn(LifeEvent, "find").mockReturnValue(mockQuery([
        { itemType: "habit", itemId: "h1", scheduledDate: "2026-01-15", status: "completed", occurredAt: new Date() },
        { itemType: "habit", itemId: "h1", scheduledDate: "2026-01-16", status: "completed", occurredAt: new Date() },
        { itemType: "habit", itemId: "h1", scheduledDate: "2026-06-10", status: "completed", occurredAt: new Date() },
        { itemType: "habit", itemId: "h1", scheduledDate: "2026-10-01", status: "completed", occurredAt: new Date() },
      ]));

      // Mock health entries with sleep, workouts, mood, and body weight
      jest.spyOn(LifeHealthEntry, "find").mockReturnValue(mockQuery([
        { type: "sleep", durationMinutes: 480, localDate: "2026-01-15" },
        { type: "sleep", durationMinutes: 460, localDate: "2026-06-10" },
        { type: "workout", durationMinutes: 60, localDate: "2026-01-16" },
        { type: "workout", durationMinutes: 45, localDate: "2026-10-01" },
        { type: "mood", canonicalValue: 4, localDate: "2026-01-15" },
        { type: "mood", canonicalValue: 5, localDate: "2026-06-10" },
        { type: "weight", canonicalValue: 74.5, localDate: "2026-01-05" },
        { type: "weight", canonicalValue: 72.0, localDate: "2026-10-01" },
      ]));

      // Mock finance entries across multiple currencies (USD and EUR)
      jest.spyOn(LifeFinanceEntry, "find").mockReturnValue(mockQuery([
        { type: "income", amountMinor: 500000, currency: "USD", localDate: "2026-01-10" },
        { type: "expense", amountMinor: 250000, currency: "USD", category: "rent", localDate: "2026-01-15" },
        { type: "income", amountMinor: 200000, currency: "EUR", localDate: "2026-06-01" },
        { type: "expense", amountMinor: 80000, currency: "EUR", category: "travel", localDate: "2026-06-05" },
      ]));

      // Mock goals with a completed goal
      jest.spyOn(LifeGoal, "find").mockReturnValue(mockQuery([
        { _id: "g1", title: "Complete Marathon", status: "completed", manualProgress: 100 },
        { _id: "g2", title: "Read 24 Books", status: "active", manualProgress: 75 },
      ]));

      // Mock journal entries with words and types, without exposing raw body
      jest.spyOn(LifeJournalEntry, "find").mockReturnValue(mockQuery([
        { type: "daily", wordCount: 250, title: "New Year Intentions", localDate: "2026-01-01" },
        { type: "monthly_review", wordCount: 450, title: "Mid-Year Reflection", localDate: "2026-06-30" },
      ]));

      const report = await reportService.buildPeriodicReport(mockUserId, {
        type: "yearly",
        date: "2026-10-01"
      });

      expect(report.type).toBe("yearly");
      expect(report.period.year).toBe(2026);
      expect(report.period.title).toContain("Yearly Review (2026)");
      expect(report.previousPeriod.title).toContain("Previous Year (2025)");

      // 12-month progression data
      expect(report.monthlyTrends).toBeDefined();
      expect(report.monthlyTrends.length).toBe(12);
      expect(report.monthlyTrends[0].label).toBe("Jan");
      expect(report.monthlyTrends[11].label).toBe("Dec");
      expect(report.monthlyTrends[0].habitsCompleted).toBe(2);
      expect(report.monthlyTrends[0].workoutSessions).toBe(1);

      // Money totals separated by currency
      expect(report.currencies).toBeDefined();
      expect(report.currencies.USD).toBeDefined();
      expect(report.currencies.USD.incomeMinor).toBe(500000);
      expect(report.currencies.USD.expenseMinor).toBe(250000);
      expect(report.currencies.USD.netMinor).toBe(250000);
      expect(report.currencies.EUR).toBeDefined();
      expect(report.currencies.EUR.incomeMinor).toBe(200000);
      expect(report.currencies.EUR.expenseMinor).toBe(80000);
      expect(report.currencies.EUR.netMinor).toBe(120000);

      // Body trends where data exists
      expect(report.bodyTrends).toBeDefined();
      expect(report.bodyTrends.firstRecorded).toBe(74.5);
      expect(report.bodyTrends.latestRecorded).toBe(72.0);
      expect(report.bodyTrends.delta).toBe(-2.5);

      // Journal activity respecting privacy rules
      expect(report.journalActivity).toBeDefined();
      expect(report.journalActivity.totalEntries).toBe(2);
      expect(report.journalActivity.totalWords).toBe(700);
      expect(report.journalActivity.byType.daily).toBe(1);
      expect(report.journalActivity.byType.monthly_review).toBe(1);

      // Real achievements based on actual data
      expect(report.achievements).toBeDefined();
      expect(report.achievements.some((a) => a.type === "goals")).toBe(true);
      expect(report.achievements.some((a) => a.type === "fitness")).toBe(true);

      // Scorecards benchmarked for yearly targets
      expect(report.scorecards.movement.target).toBe("7200 min");
      expect(report.languageBoundary).toContain("Not clinical");
    });
  });

  describe("3. Calm Reminders Engine & Quiet Hours", () => {
    test("detects quiet hours across overnight boundary (22:00 to 07:00)", () => {
      expect(reminderEngine.isQuietHours("23:30", "22:00", "07:00")).toBe(true);
      expect(reminderEngine.isQuietHours("03:15", "22:00", "07:00")).toBe(true);
      expect(reminderEngine.isQuietHours("06:59", "22:00", "07:00")).toBe(true);
      expect(reminderEngine.isQuietHours("07:01", "22:00", "07:00")).toBe(false);
      expect(reminderEngine.isQuietHours("14:00", "22:00", "07:00")).toBe(false);
      expect(reminderEngine.isQuietHours("21:59", "22:00", "07:00")).toBe(false);
    });

    test("suppresses reminder delivery during quiet hours", async () => {
      const evaluation = await reminderEngine.evaluateReminderDelivery(mockUserId, "2026-10-01", "23:00");
      expect(evaluation.shouldDeliver).toBe(false);
      expect(evaluation.reason).toBe("quiet_hours");
    });

    test("permits delivery during normal waking hours within daily cap", async () => {
      jest.spyOn(LifeEvent, "countDocuments").mockResolvedValue(2);
      const evaluation = await reminderEngine.evaluateReminderDelivery(mockUserId, "2026-10-01", "10:30");
      expect(evaluation.shouldDeliver).toBe(true);
      expect(evaluation.reason).toBeNull();
      expect(evaluation.dailyRemaining).toBe(3); // 5 cap - 2 used
    });

    test("suppresses reminder delivery when daily cap is reached", async () => {
      jest.spyOn(LifeEvent, "countDocuments").mockResolvedValue(5);
      const evaluation = await reminderEngine.evaluateReminderDelivery(mockUserId, "2026-10-01", "15:00");
      expect(evaluation.shouldDeliver).toBe(false);
      expect(evaluation.reason).toBe("daily_cap_reached");
    });

    test("generates calm, non-shaming phrasing", () => {
      const habitReminder = reminderEngine.formatCalmReminder("habit", "Morning Meditation");
      expect(habitReminder).toContain("A gentle pause for your practice: Morning Meditation.");

      const routineReminder = reminderEngine.formatCalmReminder("routine", "Evening Wind-Down");
      expect(routineReminder).toContain("Take your time.");
    });
  });

  describe("4. Journey AI Life Coaching & Privacy Scoping", () => {
    test("enforces strict privacy scopes in AI input: omits health, finance, and journals if disallowed", async () => {
      process.env.LIFE_AI_ENABLED = "true";

      AIProviderService.complete.mockResolvedValue({
        content: "Here is your gentle reflection for this week."
      });

      const session = await lifeAiService.coachingSession(mockUserId, {
        focusArea: "habits",
        note: "Need advice on consistency"
      });

      expect(session.available).toBe(true);
      expect(session.coaching).toContain("gentle reflection");
      expect(session.activeScopes).toEqual(["habits", "goals"]);
      expect(session.activeScopes).not.toContain("health");
      expect(session.activeScopes).not.toContain("finance");
      expect(session.activeScopes).not.toContain("journal");
      expect(session.disclaimer).toContain("does not replace medical");
    });
  });

  describe("5. Express API Routes Integration", () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.user = { _id: mockUserId, email: "test@myjourney.life" };
        next();
      });
      const lifeRoutes = require("../life/routes");
      app.use("/api/life", lifeRoutes);
      // error handler
      app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({ error: err.message });
      });
    });

    test("GET /api/life/insights/correlations returns correlation response", async () => {
      jest.spyOn(LifeDailySummary, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(LifeSleepSession, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(LifeWorkoutSession, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(LifeFinanceEntry, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(LifeHealthEntry, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      jest.spyOn(LifeEvent, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const res = await request(app).get("/api/life/insights/correlations?days=30");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.correlations).toBeDefined();
      expect(Array.isArray(res.body.data.correlations)).toBe(true);
    });

    test("GET /api/life/reminders/status returns quiet hours and quota info", async () => {
      jest.spyOn(LifeEvent, "countDocuments").mockResolvedValue(1);

      const res = await request(app).get("/api/life/reminders/status?time=12:00&date=2026-10-01");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dailyCap).toBe(5);
      expect(res.body.data.quietHours.enabled).toBe(true);
    });

    test("POST /api/life/reminders/evaluate checks delivery eligibility", async () => {
      const res = await request(app)
        .post("/api/life/reminders/evaluate")
        .send({ date: "2026-10-01", time: "23:00" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shouldDeliver).toBe(false);
      expect(res.body.data.reason).toBe("quiet_hours");
    });
  });
});
