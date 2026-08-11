const LifeEvent = require("../life/models/LifeEvent");
const { progressForGoals } = require("../life/services/goalProgressService");

describe("Life linked-goal progress", () => {
  afterEach(() => jest.restoreAllMocks());

  test("counts only latest completed habit occurrences returned by the history pipeline", async () => {
    const aggregate = jest.spyOn(LifeEvent, "aggregate").mockResolvedValue([{ _id: "habit-a", count: 3 }, { _id: "habit-b", count: 2 }]);
    const goals = [{ _id: "goal-a", progressStrategy: "linked_completions", targetValue: 10, linkedHabits: ["habit-a", "habit-b"] }];
    const result = await progressForGoals("user-a", goals);
    expect(result.get("goal-a")).toBe(50);
    expect(aggregate.mock.calls[0][0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ $sort: { occurredAt: 1, createdAt: 1 } }),
      expect.objectContaining({ $match: { status: "completed" } }),
    ]));
  });

  test("does not query history for goals without linked habits", async () => {
    const aggregate = jest.spyOn(LifeEvent, "aggregate");
    const result = await progressForGoals("user-a", [{ _id: "goal-a", progressStrategy: "manual", manualProgress: 42 }]);
    expect(result.get("goal-a")).toBe(42);
    expect(aggregate).not.toHaveBeenCalled();
  });
});
