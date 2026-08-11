const LifeFinanceEntry = require("../life/models/LifeFinanceEntry");
const LifeGoal = require("../life/models/LifeGoal");
const LifeHabit = require("../life/models/LifeHabit");
const LifeJournalEntry = require("../life/models/LifeJournalEntry");
const habitService = require("../life/services/habitService");
const eventService = require("../life/services/eventService");
const dataService = require("../life/services/lifeDataService");

const pagedQuery = (items = []) => ({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(items) });

describe("Life ownership boundaries", () => {
  afterEach(() => jest.restoreAllMocks());

  test("User A cannot read User B habit", async () => {
    const find = jest.spyOn(LifeHabit, "findOne").mockResolvedValue(null);
    await expect(habitService.getHabit("user-a", "habit-b")).rejects.toMatchObject({ status: 404 });
    expect(find).toHaveBeenCalledWith({ _id: "habit-b", user: "user-a" });
  });

  test("User A cannot update User B goal", async () => {
    const update = jest.spyOn(LifeGoal, "findOneAndUpdate").mockResolvedValue(null);
    await expect(dataService.updateGoal("user-a", "goal-b", { title: "No" })).rejects.toMatchObject({ status: 404 });
    expect(update.mock.calls[0][0]).toEqual({ _id: "goal-b", user: "user-a" });
  });

  test("User A expense reads are always user-scoped", async () => {
    const find = jest.spyOn(LifeFinanceEntry, "find").mockReturnValue(pagedQuery());
    jest.spyOn(LifeFinanceEntry, "countDocuments").mockResolvedValue(0);
    await dataService.listFinanceEntries("user-a", {});
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ user: "user-a", deletedAt: null }));
  });

  test("User A journal reads are always user-scoped", async () => {
    const find = jest.spyOn(LifeJournalEntry, "find").mockReturnValue(pagedQuery());
    jest.spyOn(LifeJournalEntry, "countDocuments").mockResolvedValue(0);
    await dataService.listJournalEntries("user-a", {});
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ user: "user-a", deletedAt: null }));
  });

  test("User A cannot complete User B item", async () => {
    const find = jest.spyOn(LifeHabit, "findOne").mockResolvedValue(null);
    await expect(eventService.assertOwnedItem("user-a", "habit", "habit-b")).rejects.toMatchObject({ status: 404 });
    expect(find).toHaveBeenCalledWith({ _id: "habit-b", user: "user-a" });
  });

  test("User A cannot link a habit to User B goal", async () => {
    jest.spyOn(LifeHabit, "findOne").mockResolvedValue({ _id: "habit-a", user: "user-a", linkedGoal: null, save: jest.fn() });
    const goalFind = jest.spyOn(LifeGoal, "findOne").mockResolvedValue(null);
    await expect(habitService.updateHabit("user-a", "habit-a", { linkedGoal: "goal-b" })).rejects.toMatchObject({ status: 404 });
    expect(goalFind).toHaveBeenCalledWith({ _id: "goal-b", user: "user-a" });
  });
});
