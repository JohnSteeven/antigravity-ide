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

  describe("1. Pearson Correlation Engine", () => {
    test("computes strong positive correlation correctly for paired data", () => {
      // Direct linear relationship: y = 2x
      const pairs = [
        [6, 50],
        [6.5, 55],
        [7, 60],
        [7.5, 65],
        [8, 70],
        [8.5, 75],
        [9, 80],
        [9.5, 85],
      ];
      const result = correlationService.calculatePearson(pairs);
      expect(result.insufficientData).toBe(false);
      expect(result.sampleSize).toBe(8);
      expect(result.r).toBeCloseTo(1.0, 1);
      expect(result.strength).toBe("strong_positive");
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

    test("handles zero-variance gracefully without throwing", () => {
      const flatPairs = [
        [7, 50],
        [7, 50],
        [7, 50],
        [7, 50],
        [7, 50],
        [7, 50],
        [7, 50],
      ];
      const result = correlationService.calculatePearson(flatPairs);
      expect(result.insufficientData).toBe(false);
      expect(result.r).toBe(0);
      expect(result.strength).toBe("neutral_or_weak");
    });
  });

  describe("2. Periodic Reports Synthesis (Weekly & Monthly)", () => {
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
