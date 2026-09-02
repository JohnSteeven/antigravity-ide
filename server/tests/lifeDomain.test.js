const { calculateGoalProgress, sleepDurationMinutes, summarizeBudget, toWaterMl } = require("../life/domain/calculations");
const { generateSchedule, isScheduledOnDate, normalizeSchedule } = require("../life/domain/recurrence");
const { addLocalDays, localDateKey, zonedDateTimeToUtc, zonedDayRange } = require("../life/domain/time");
const { isQuietTime } = require("../life/scheduling/notificationService");
const { buildIdempotencyKey } = require("../life/services/eventService");

describe("Life domain rules", () => {
  test("normalizes bounded recurrence inputs", () => {
    expect(normalizeSchedule({ type: "specific_weekdays", weekdays: [5, 1, 1, 9], interval: 999 }).weekdays).toEqual([1, 5]);
    expect(normalizeSchedule({ interval: 999 }).interval).toBe(365);
  });

  test.each([
    ["weekdays", "2026-08-10", true],
    ["weekdays", "2026-08-09", false],
    ["weekends", "2026-08-16", true],
    ["specific_weekdays", "2026-08-12", true],
    ["every_n_days", "2026-08-15", true],
    ["days_of_month", "2026-08-15", true],
    ["specific_dates", "2026-08-22", true],
  ])("evaluates %s schedules", (type, date, expected) => {
    const schedule = { type, startDate: "2026-08-10", weekdays: [3], interval: 5, daysOfMonth: [15], dates: ["2026-08-22"], pausedRanges: [] };
    expect(isScheduledOnDate(schedule, date)).toBe(expected);
  });

  test("monthly recurrence clamps to the last day", () => {
    expect(isScheduledOnDate({ type: "monthly", startDate: "2026-01-31" }, "2026-02-28")).toBe(true);
  });

  test("pause ranges suppress occurrences without rewriting the rule", () => {
    expect(isScheduledOnDate({ type: "daily", startDate: "2026-08-01", pausedRanges: [{ start: "2026-08-10", end: "2026-08-12" }] }, "2026-08-11")).toBe(false);
  });

  test("schedule generation is bounded and ordered", () => {
    expect(generateSchedule({ type: "specific_weekdays", startDate: "2026-08-10", weekdays: [1, 3, 5] }, "2026-08-10", "2026-08-16")).toEqual(["2026-08-10", "2026-08-12", "2026-08-14"]);
    expect(() => generateSchedule({ type: "daily", startDate: "2020-01-01" }, "2020-01-01", "2030-01-01", 20)).toThrow();
  });

  test.each([
    ["Asia/Kolkata", "2026-08-10T18:30:00.000Z", "2026-08-11"],
    ["America/New_York", "2026-08-11T03:30:00.000Z", "2026-08-10"],
    ["Europe/London", "2026-08-10T23:30:00.000Z", "2026-08-11"],
  ])("calculates the local date in %s", (zone, instant, expected) => expect(localDateKey(new Date(instant), zone)).toBe(expected));

  test("handles DST forward by moving a nonexistent wall time forward by the gap", () => {
    expect(zonedDateTimeToUtc({ dateKey: "2026-03-08", hour: 2, minute: 30 }, "America/New_York").toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  test("handles DST backward deterministically using the earlier occurrence", () => {
    expect(zonedDateTimeToUtc({ dateKey: "2026-11-01", hour: 1, minute: 30 }, "America/New_York").toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });

  test("creates correct local-midnight ranges across DST", () => {
    const spring = zonedDayRange("2026-03-08", "America/New_York");
    const autumn = zonedDayRange("2026-11-01", "America/New_York");
    expect((spring.end - spring.start) / 3600000).toBe(23);
    expect((autumn.end - autumn.start) / 3600000).toBe(25);
  });

  test("local date arithmetic is timezone-independent", () => expect(addLocalDays("2026-12-31", 1)).toBe("2027-01-01"));
  test("converts supported water units to canonical millilitres", () => { expect(toWaterMl(1.5, "l")).toBe(1500); expect(toWaterMl(8, "oz")).toBe(237); });
  test("calculates overnight sleep using absolute instants", () => expect(sleepDurationMinutes("2026-08-10T22:45:00Z", "2026-08-11T06:15:00Z")).toBe(450));
  test("rejects invalid sleep spans", () => expect(() => sleepDurationMinutes("2026-08-11T08:00:00Z", "2026-08-11T07:00:00Z")).toThrow());
  test("calculates manual, milestone, quantity, and linked goal progress", () => {
    expect(calculateGoalProgress({ manualProgress: 37 })).toBe(37);
    expect(calculateGoalProgress({ progressStrategy: "milestones", milestones: [{ completedAt: new Date() }, {}, {}] })).toBe(33);
    expect(calculateGoalProgress({ progressStrategy: "quantity", currentValue: 12, targetValue: 10 })).toBe(100);
    expect(calculateGoalProgress({ progressStrategy: "linked_completions", targetValue: 8 }, { linkedCompletions: 2 })).toBe(25);
  });
  test("keeps budget overage visible", () => expect(summarizeBudget({ limitMinor: 10000, spentMinor: 12500 })).toEqual({ limitMinor: 10000, spentMinor: 12500, remainingMinor: -2500, percentUsed: 125 }));
  test("quiet hours support same-day and overnight windows", () => {
    expect(isQuietTime("13:00", { enabled: true, start: "12:00", end: "14:00" })).toBe(true);
    expect(isQuietTime("23:00", { enabled: true, start: "22:00", end: "07:00" })).toBe(true);
    expect(isQuietTime("12:00", { enabled: true, start: "22:00", end: "07:00" })).toBe(false);
  });
  test("completion idempotency converges rapid taps and multiple devices", () => {
    const base = { itemType: "habit", itemId: "64b000000000000000000001", scheduledDate: "2026-08-11", status: "completed", quantity: 1 };
    expect(buildIdempotencyKey({ ...base, clientMutationId: "device-a-123" })).toBe(buildIdempotencyKey({ ...base, clientMutationId: "device-b-456" }));
    expect(buildIdempotencyKey(base)).not.toBe(buildIdempotencyKey({ ...base, status: "skipped" }));
  });
  test("separate daily times remain separate occurrences", () => {
    const base = { itemType: "medication", itemId: "64b000000000000000000001", scheduledDate: "2026-08-11", status: "completed" };
    expect(buildIdempotencyKey({ ...base, scheduledTime: "08:00" })).not.toBe(buildIdempotencyKey({ ...base, scheduledTime: "20:00" }));
  });
  test("routine step corrections create a new semantic event", () => {
    const base = { itemType: "routine", itemId: "64b000000000000000000001", scheduledDate: "2026-08-11", scheduledTime: "08:00", status: "partial" };
    expect(buildIdempotencyKey({ ...base, routineSteps: [{ stepId: "64b000000000000000000002", title: "Water", status: "pending" }] })).not.toBe(buildIdempotencyKey({ ...base, routineSteps: [{ stepId: "64b000000000000000000002", title: "Water", status: "completed" }] }));
  });
  test("skip and missed remain distinct event states", () => expect(buildIdempotencyKey({ itemType: "habit", itemId: "x", scheduledDate: "2026-08-11", status: "skipped" })).not.toBe(buildIdempotencyKey({ itemType: "habit", itemId: "x", scheduledDate: "2026-08-11", status: "missed" })));
});
