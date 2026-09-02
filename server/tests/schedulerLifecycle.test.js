describe("scheduler lifecycle", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns an idempotent runtime and clears every timer on close", () => {
    jest.doMock("mongoose", () => ({ connection: { readyState: 0 } }));
    jest.doMock("../services/notificationSchedulerService", () => ({
      handleDailyQuotes: jest.fn(),
      handleReadingReminders: jest.fn(),
      handleWeeklySummary: jest.fn(),
    }));
    jest.doMock("../life/scheduling/notificationService", () => ({
      processDueNotifications: jest.fn(),
      replenishReminderJobs: jest.fn(),
      scheduleBriefJobs: jest.fn(),
    }));
    jest.doMock("../services/accountDeletionService", () => ({
      purgeDueAccounts: jest.fn(),
    }));
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const { startScheduler } = require("../cron");

    const first = startScheduler();
    const second = startScheduler();

    expect(second).toBe(first);
    expect(jest.getTimerCount()).toBe(3);

    first.close();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });
});
