const LifeFinanceEntry = require("../life/models/LifeFinanceEntry");
const LifeFinancePlan = require("../life/models/LifeFinancePlan");
const LifeGoal = require("../life/models/LifeGoal");
const LifeHabit = require("../life/models/LifeHabit");
const LifeHealthEntry = require("../life/models/LifeHealthEntry");
const LifeJournalEntry = require("../life/models/LifeJournalEntry");
const LifeMedication = require("../life/models/LifeMedication");
const LifeRoutine = require("../life/models/LifeRoutine");
const LifeScheduleVersion = require("../life/models/LifeScheduleVersion");
const LifeTask = require("../life/models/LifeTask");
const eventService = require("../life/services/eventService");
const profileService = require("../life/services/profileService");
const todayService = require("../life/services/todayService");

const lean = (rows) => ({ lean: jest.fn().mockResolvedValue(rows) });
const sortedLean = (rows) => ({ sort: jest.fn().mockReturnValue(lean(rows)) });

describe("Life Today aggregation", () => {
  afterEach(() => jest.restoreAllMocks());

  test("combines multi-time habits, routines, medications, tasks, summaries, and immutable event status", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ timezone: "Asia/Kolkata", visibleModules: ["habits", "routines", "water", "sleep", "money"], waterTargetMl: 2000, vacationMode: { enabled: false } });
    jest.spyOn(LifeScheduleVersion, "find").mockReturnValue(lean([
      { itemType: "habit", itemId: "habit-a", timezone: "Asia/Kolkata", schedule: { type: "daily", startDate: "2026-08-01", times: ["08:00", "18:00"] } },
      { itemType: "routine", itemId: "routine-a", timezone: "Asia/Kolkata", schedule: { type: "daily", startDate: "2026-08-01", times: ["07:00"] } },
      { itemType: "medication", itemId: "med-a", timezone: "Asia/Kolkata", schedule: { type: "daily", startDate: "2026-08-01", times: ["08:00", "20:00"] } },
    ]));
    jest.spyOn(LifeTask, "find").mockReturnValue(sortedLean([{ _id: "task-a", title: "Call home", period: "evening", priority: "none" }]));
    jest.spyOn(eventService, "latestEventsForDate").mockResolvedValue(new Map([["medication:med-a:08:00", { status: "completed", occurrenceKey: "08:00" }]]));
    jest.spyOn(LifeHealthEntry, "find").mockReturnValue(sortedLean([{ type: "water", canonicalValue: 500 }, { type: "sleep", durationMinutes: 450, quality: 4 }]));
    jest.spyOn(LifeFinanceEntry, "find").mockReturnValue(sortedLean([{ type: "expense", currency: "INR", amountMinor: 25000 }]));
    jest.spyOn(LifeGoal, "find").mockReturnValue(lean([{ _id: "goal-a", title: "Build strength", progressStrategy: "manual", manualProgress: 25 }]));
    jest.spyOn(LifeJournalEntry, "findOne").mockReturnValue(sortedLean(null));
    jest.spyOn(LifeFinancePlan, "find").mockReturnValue(lean([]));
    jest.spyOn(LifeHabit, "find").mockReturnValue(lean([{ _id: "habit-a", name: "Walk", intent: "build", measurementType: "duration", target: 10, unit: "minutes", preferredPeriod: "anytime" }]));
    jest.spyOn(LifeRoutine, "find").mockReturnValue(lean([{ _id: "routine-a", name: "Morning routine", items: [{ _id: "step-a", title: "Water", order: 1 }, { _id: "step-b", title: "Stretch", order: 2 }] }]));
    jest.spyOn(LifeMedication, "find").mockReturnValue(lean([{ _id: "med-a", name: "Recorded medicine", doseText: "As entered" }]));

    const result = await todayService.getToday("user-a", "2026-08-11");
    const items = Object.values(result.timeline.groups).flat();
    expect(result.timeline.total).toBe(6);
    expect(items.filter((item) => item.type === "habit")).toHaveLength(2);
    expect(items.filter((item) => item.type === "medication")).toHaveLength(2);
    expect(items.find((item) => item.type === "routine").steps).toHaveLength(2);
    expect(items.find((item) => item.id === "med-a:08:00").status).toBe("completed");
    expect(items.find((item) => item.id === "med-a:20:00").status).toBe("pending");
    expect(result.summary.water.currentMl).toBe(500);
    expect(result.summary.sleep.durationMinutes).toBe(450);
    expect(result.summary.spending).toEqual({ INR: 25000 });
  });
});
