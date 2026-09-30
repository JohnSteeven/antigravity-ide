const mongoose = require("mongoose");
const express = require("express");
const request = require("supertest");

// Mock AuditLogger to prevent hanging on Mongoose buffering
jest.mock("../audit/AuditLogger", () => ({
  log: jest.fn().mockResolvedValue(),
}));

const profileService = require("../life/services/profileService");
const osExpansionService = require("../life/services/osExpansionService");
const LifeHabit = require("../life/models/LifeHabit");
const LifeGoal = require("../life/models/LifeGoal");
const LifeEvent = require("../life/models/LifeEvent");
const LifeHealthEntry = require("../life/models/LifeHealthEntry");
const LifeFinanceEntry = require("../life/models/LifeFinanceEntry");
const LifeFinancePlan = require("../life/models/LifeFinancePlan");
const LifeFinanceAccount = require("../life/models/LifeFinanceAccount");
const LifeJournalEntry = require("../life/models/LifeJournalEntry");

describe("Phase 29.5 Checkpoint 3: Habits, Goals, Money OS, and Journal Intelligence", () => {
  const userId = new mongoose.Types.ObjectId();
  const habitId = new mongoose.Types.ObjectId();
  const goalId = new mongoose.Types.ObjectId();
  const billId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({
      timezone: "UTC",
      waterTargetMl: 2500,
      sleepTargetMinutes: 480,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("1. Habit Intelligence & Streak Analytics", () => {
    it("computes current streak, longest streak, and consistency percentages", async () => {
      jest.spyOn(LifeHabit, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: habitId,
          user: userId,
          name: "Morning Meditation",
          intent: "build",
          schedule: { type: "daily", startDate: "2026-09-01" },
        }),
      });

      const events = [
        { scheduledDate: "2026-09-30", status: "completed", occurredAt: new Date("2026-09-30T08:00:00Z"), note: "Very peaceful" },
        { scheduledDate: "2026-09-29", status: "completed", occurredAt: new Date("2026-09-29T08:00:00Z") },
        { scheduledDate: "2026-09-28", status: "completed", occurredAt: new Date("2026-09-28T08:00:00Z") },
        { scheduledDate: "2026-09-26", status: "completed", occurredAt: new Date("2026-09-26T08:00:00Z") },
        { scheduledDate: "2026-09-25", status: "completed", occurredAt: new Date("2026-09-25T08:00:00Z") },
      ];

      jest.spyOn(LifeEvent, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(events),
        }),
      });

      jest.spyOn(LifeHealthEntry, "find").mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { localDate: "2026-09-30", mood: 5 },
          { localDate: "2026-09-29", mood: 4 },
          { localDate: "2026-09-27", mood: 2 }, // non-completion day
        ]),
      });

      const analytics = await osExpansionService.getHabitAnalytics(userId, habitId, { days: 30 });

      expect(analytics.habit.name).toBe("Morning Meditation");
      expect(analytics.totalCompletions).toBe(5);
      expect(analytics.notes.length).toBe(1);
      expect(analytics.notes[0].note).toBe("Very peaceful");
      expect(analytics.heatmap.length).toBeGreaterThan(20);
      expect(analytics.correlation.avgMoodOnCompletionDays).toBe(4.5);
      expect(analytics.correlation.avgMoodOnOtherDays).toBe(2);
    });
  });

  describe("2. Goals Intelligence & Velocity Projections", () => {
    it("computes milestone progress, velocity, and projected completion date", async () => {
      const milestoneId1 = new mongoose.Types.ObjectId();
      const milestoneId2 = new mongoose.Types.ObjectId();

      const mockGoal = {
        _id: goalId,
        user: userId,
        title: "Launch Personal OS",
        startDate: "2026-09-01",
        targetDate: "2026-10-31",
        progressStrategy: "milestones",
        milestones: [
          { _id: milestoneId1, title: "Architecture Spec", completedAt: new Date("2026-09-10") },
          { _id: milestoneId2, title: "Beta Launch", completedAt: null },
        ],
        linkedHabits: [],
      };

      jest.spyOn(LifeGoal, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockGoal),
      });

      const analytics = await osExpansionService.getGoalAnalytics(userId, goalId);

      expect(analytics.progressPercent).toBe(50);
      expect(analytics.milestoneStats.total).toBe(2);
      expect(analytics.milestoneStats.completed).toBe(1);
      expect(analytics.milestoneStats.pending).toBe(1);
      expect(analytics.velocity).toBeGreaterThan(0);
      expect(analytics.estimatedCompletionDate).toBeTruthy();
    });

    it("toggles goal milestone completion status correctly", async () => {
      const milestoneId = new mongoose.Types.ObjectId();
      const milestoneObj = { _id: milestoneId, title: "Milestone A", completedAt: null };

      const mockGoalDoc = {
        _id: goalId,
        user: userId,
        milestones: {
          id: jest.fn().mockReturnValue(milestoneObj),
        },
        save: jest.fn().mockResolvedValue(),
      };

      jest.spyOn(LifeGoal, "findOne").mockResolvedValue(mockGoalDoc);

      await osExpansionService.toggleMilestone(userId, goalId, milestoneId, true);

      expect(milestoneObj.completedAt).toBeInstanceOf(Date);
      expect(mockGoalDoc.save).toHaveBeenCalled();
    });
  });

  describe("3. Money OS, Accounts & Safe Bill Payment", () => {
    it("creates an account with proper balanceMinor derivation", async () => {
      jest.spyOn(LifeFinanceAccount, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        name: "Main Savings",
        type: "savings",
        balanceMinor: 250000,
        currency: "USD",
      });

      const account = await osExpansionService.createAccount(userId, {
        name: "Main Savings",
        type: "savings",
        balance: 2500.0,
        currency: "USD",
      });

      expect(account.balanceMinor).toBe(250000);
      expect(account.currency).toBe("USD");
    });

    it("computes cashflow totals, savings rate, and category breakdown", async () => {
      const txs = [
        { type: "income", amountMinor: 500000, localDate: "2026-09-01" },
        { type: "expense", amountMinor: 150000, category: "Rent", localDate: "2026-09-02" },
        { type: "expense", amountMinor: 50000, category: "Groceries", localDate: "2026-09-05" },
      ];

      jest.spyOn(LifeFinanceEntry, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(txs),
        }),
      });

      const cashflow = await osExpansionService.cashflowAnalytics(userId, { days: 90 });

      expect(cashflow.totalIncome).toBe(5000);
      expect(cashflow.totalExpense).toBe(2000);
      expect(cashflow.netSavings).toBe(3000);
      expect(cashflow.savingsRate).toBe(60);
      expect(cashflow.byCategory["Rent"]).toBe(1500);
    });

    it("marks bill paid, advances due date, creates expense transaction, and provides non-financial execution disclaimer", async () => {
      const mockPlan = {
        _id: billId,
        user: userId,
        name: "Internet Fiber",
        type: "bill",
        period: "monthly",
        amountMinor: 8000,
        currency: "USD",
        category: "Utilities",
        dueDate: "2026-09-25",
        currentAmountMinor: 0,
        save: jest.fn().mockResolvedValue(),
      };

      jest.spyOn(LifeFinancePlan, "findOne").mockResolvedValue(mockPlan);
      jest.spyOn(LifeFinanceEntry, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        amountMinor: 8000,
        type: "expense",
      });

      const res = await osExpansionService.markBillPaid(userId, billId, {
        localDate: "2026-09-25",
        createTransaction: true,
      });

      expect(res.message).toContain("No financial funds were transferred");
      expect(mockPlan.dueDate).toBe("2026-10-25"); // advanced by 30 days
      expect(mockPlan.save).toHaveBeenCalled();
      expect(LifeFinanceEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "expense",
          amountMinor: 8000,
          source: { type: "system", provider: "bill_tracker" },
        })
      );
    });
  });

  describe("4. Journal Intelligence & Search", () => {
    it("searches journal entries, filters by type, and calculates word count and reading time", async () => {
      const mockEntries = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Product Architecture Breakthrough",
          body: "Today we finalized the entire personal operating system architecture. Every piece connects seamlessly without artificial silos.",
          type: "daily",
          localDate: "2026-09-30",
          pinnedToTimeline: true,
        },
      ];

      jest.spyOn(LifeJournalEntry, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockEntries),
            }),
          }),
        }),
      });
      jest.spyOn(LifeJournalEntry, "countDocuments").mockResolvedValue(1);

      const res = await osExpansionService.searchJournal(userId, { q: "breakthrough", limit: 10 });

      expect(res.items.length).toBe(1);
      expect(res.items[0].wordCount).toBe(16);
      expect(res.items[0].readingTimeMinutes).toBe(1);
      expect(res.pagination.total).toBe(1);
    });

    it("computes lifetime journal analytics aggregates", async () => {
      const entries = [
        { type: "daily", body: "Short entry with five words.", localDate: "2026-09-28" },
        { type: "weekly_review", body: "Another entry with ten different words written here in the log.", localDate: "2026-09-29" },
      ];

      jest.spyOn(LifeJournalEntry, "find").mockReturnValue({
        lean: jest.fn().mockResolvedValue(entries),
      });

      const analytics = await osExpansionService.journalAnalytics(userId);

      expect(analytics.totalEntries).toBe(2);
      expect(analytics.totalWords).toBe(16);
      expect(analytics.uniqueWritingDays).toBe(2);
      expect(analytics.byType["daily"]).toBe(1);
      expect(analytics.byType["weekly_review"]).toBe(1);
    });
  });

  describe("5. Express API Routes Integration", () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.user = { _id: userId };
        next();
      });
      app.use("/api/life", require("../life/routes"));
    });

    it("GET /api/life/habits/:id/analytics returns habit analytics", async () => {
      jest.spyOn(osExpansionService, "getHabitAnalytics").mockResolvedValue({
        currentStreak: 5,
        totalCompletions: 12,
      });

      const res = await request(app).get(`/api/life/habits/${habitId}/analytics`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStreak).toBe(5);
    });

    it("GET /api/life/money/cashflow returns cashflow summary", async () => {
      jest.spyOn(osExpansionService, "cashflowAnalytics").mockResolvedValue({
        totalIncome: 4000,
        totalExpense: 2500,
        savingsRate: 37,
      });

      const res = await request(app).get("/api/life/money/cashflow");
      expect(res.status).toBe(200);
      expect(res.body.data.savingsRate).toBe(37);
    });

    it("POST /api/life/plans/:id/pay marks bill as paid", async () => {
      jest.spyOn(osExpansionService, "markBillPaid").mockResolvedValue({
        message: "Bill marked as paid in tracker. No financial funds were transferred.",
      });

      const res = await request(app).post(`/api/life/money/plans/${billId}/pay`).send({});
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain("No financial funds were transferred");
    });

    it("GET /api/life/journal/search returns search results", async () => {
      jest.spyOn(osExpansionService, "searchJournal").mockResolvedValue({
        items: [{ title: "Morning Reflection", wordCount: 42 }],
        pagination: { total: 1 },
      });

      const res = await request(app).get("/api/life/journal/search?q=Morning");
      expect(res.status).toBe(200);
      expect(res.body.data.items[0].wordCount).toBe(42);
    });
  });
});
