const { buildLifeFixture, SCENARIOS } = require("../life/fixtures/createLifeFixture");

describe("Life development fixture generators", () => {
  test("covers every required safe scenario without persistence side effects", () => {
    expect(SCENARIOS).toEqual(["new-user", "habit-heavy", "health-tracking", "goal-focused", "money-tracking", "long-history", "notification-heavy"]);
    SCENARIOS.forEach((scenario) => {
      const fixture = buildLifeFixture(scenario, { userId: "fixture-user", today: "2026-08-11" });
      expect(fixture).toMatchObject({ scenario, developmentOnly: true, userId: "fixture-user" });
    });
  });

  test("high-volume fixture boundaries are explicit and bounded", () => {
    expect(buildLifeFixture("habit-heavy").habits).toHaveLength(40);
    expect(buildLifeFixture("health-tracking").health).toHaveLength(120);
    expect(buildLifeFixture("money-tracking").financeEntries).toHaveLength(120);
    expect(buildLifeFixture("long-history").events).toHaveLength(365);
    expect(buildLifeFixture("notification-heavy").notificationJobs).toHaveLength(350);
  });

  test("unknown fixtures fail closed", () => expect(() => buildLifeFixture("production-seed")).toThrow(/Unknown Life fixture/));
});
