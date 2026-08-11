const LifeEvent = require("../life/models/LifeEvent");
const LifeFinanceEntry = require("../life/models/LifeFinanceEntry");
const LifeGoal = require("../life/models/LifeGoal");
const LifeHealthEntry = require("../life/models/LifeHealthEntry");
const LifeInsight = require("../life/models/LifeInsight");
const LifeScheduleVersion = require("../life/models/LifeScheduleVersion");
const profileService = require("../life/services/profileService");
const insightService = require("../life/services/insightService");

const lean = (rows) => ({ lean: jest.fn().mockResolvedValue(rows) });

describe("Life deterministic insight rules", () => {
  afterEach(() => jest.restoreAllMocks());

  test("builds auditable observations from historical events and keeps advisory boundaries", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ timezone: "UTC" });
    jest.spyOn(LifeScheduleVersion, "find").mockReturnValue(lean([{ effectiveFrom: "2026-08-01", effectiveTo: null, schedule: { type: "daily", startDate: "2026-08-01" } }]));
    jest.spyOn(LifeEvent, "find").mockImplementation((filter) => lean(filter.scheduledDate.$gte === "2026-08-05" ? [{ itemType: "habit", itemId: "habit-a", scheduledDate: "2026-08-11", status: "completed", occurredAt: new Date("2026-08-11T08:00:00Z") }] : []));
    jest.spyOn(LifeHealthEntry, "find").mockReturnValue(lean([{ type: "sleep", durationMinutes: 420 }, { type: "sleep", durationMinutes: 480 }]));
    jest.spyOn(LifeFinanceEntry, "find").mockReturnValue(lean([{ type: "expense", currency: "USD", amountMinor: 1250 }]));
    jest.spyOn(LifeGoal, "find").mockReturnValue(lean([{ updatedAt: new Date("2026-07-01") }]));
    jest.spyOn(LifeInsight, "findOneAndUpdate").mockImplementation((_filter, update) => ({ lean: jest.fn().mockResolvedValue({ _id: update.$set.type, ...update.$set }) }));

    const result = await insightService.buildInsights("user-a", { start: "2026-08-05", end: "2026-08-11" });
    expect(result.metrics).toMatchObject({ planned: 7, completed: 1, consistency: 14 });
    expect(result.insights.map((item) => item.type)).toEqual(expect.arrayContaining(["habit_consistency", "sleep_average", "spending_usd", "goal_attention"]));
    expect(result.languageBoundary).toMatch(/do not provide medical or financial conclusions/i);
    expect(JSON.stringify(result.insights)).not.toMatch(/diagnos|guarantee|must invest/i);
  });
});
