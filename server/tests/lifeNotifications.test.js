const Notification = require("../models/Notification");
const LifeEvent = require("../life/models/LifeEvent");
const LifeHabit = require("../life/models/LifeHabit");
const LifeNotificationDelivery = require("../life/models/LifeNotificationDelivery");
const LifeNotificationJob = require("../life/models/LifeNotificationJob");
const profileService = require("../life/services/profileService");
const notificationService = require("../life/scheduling/notificationService");

const profile = {
  timezone: "Asia/Kolkata",
  notifications: { enabled: true, channels: ["in_app"], dailyCap: 3, quietHours: { enabled: true, start: "22:00", end: "07:00" } },
};

describe("Life notification rules", () => {
  beforeEach(() => { jest.spyOn(LifeNotificationJob, "updateMany").mockResolvedValue({}); });
  afterEach(() => jest.restoreAllMocks());

  test("habit reminder scheduling is bounded and deduplicated by occurrence/channel", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue(profile);
    const bulk = jest.spyOn(LifeNotificationJob, "bulkWrite").mockResolvedValue({});
    const result = await notificationService.scheduleHabitReminders("user-a", { _id: "habit-a", name: "Walk", why: "Feel steady", status: "active", schedule: { type: "daily", startDate: "2026-08-11", times: ["08:00"] }, reminder: { enabled: true, times: ["08:00"], channels: ["in_app"] } }, 2, "2026-08-11");
    expect(result.scheduled).toBe(3);
    const keys = bulk.mock.calls[0][0].map((operation) => operation.updateOne.update.$setOnInsert.dedupeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("snooze creation is idempotent", async () => {
    const upsert = jest.spyOn(LifeNotificationJob, "findOneAndUpdate").mockResolvedValue({ _id: "job" });
    const event = { _id: "event-a", itemType: "habit", itemId: "habit-a", scheduledDate: "2026-08-11", snoozedUntil: new Date("2026-08-11T08:00:00Z") };
    await notificationService.scheduleSnooze("user-a", event, { name: "Walk" });
    expect(upsert.mock.calls[0][0]).toEqual({ dedupeKey: "snooze:event-a:in_app" });
    expect(upsert.mock.calls[0][2]).toMatchObject({ upsert: true });
  });

  test("medication reminder copy repeats recorded instructions without advice", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue(profile);
    const bulk = jest.spyOn(LifeNotificationJob, "bulkWrite").mockResolvedValue({});
    await notificationService.scheduleMedicationReminders("user-a", { _id: "med-a", name: "Recorded medicine", doseText: "One tablet as entered", status: "active", schedule: { type: "daily", startDate: "2026-08-11", times: ["08:00"] }, reminder: { enabled: true, times: ["08:00"], channels: ["in_app"] } }, 0, "2026-08-11");
    const message = bulk.mock.calls[0][0][0].updateOne.update.$setOnInsert.message;
    expect(message).toContain("One tablet as entered");
    expect(message).toContain("Follow your own instructions");
    expect(message).not.toMatch(/should|recommend|increase|decrease/i);
  });

  test("completed and intentionally skipped occurrences suppress reminders", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ ...profile, notifications: { ...profile.notifications, quietHours: { enabled: false } } });
    const sort = jest.fn().mockResolvedValue({ status: "skipped" });
    jest.spyOn(LifeEvent, "findOne").mockReturnValue({ sort });
    const allowed = await notificationService.eligibility({ user: "user-a", itemType: "habit", itemId: "habit-a", occurrenceDate: "2026-08-11", channel: "in_app" }, new Date("2026-08-11T06:00:00Z"));
    expect(allowed).toEqual({ eligible: false, reason: "skipped" });
  });

  test("quiet hours reschedule instead of delivering or counting as missed", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue(profile);
    jest.spyOn(LifeEvent, "findOne").mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    jest.spyOn(LifeHabit, "findOne").mockResolvedValue({ status: "active" });
    jest.spyOn(LifeNotificationDelivery, "countDocuments").mockResolvedValue(0);
    const allowed = await notificationService.eligibility({ user: "user-a", itemType: "habit", itemId: "habit-a", occurrenceDate: "2026-08-11", channel: "in_app" }, new Date("2026-08-11T18:00:00Z"));
    expect(allowed.eligible).toBe(false);
    expect(allowed.reason).toBe("quiet_hours");
    expect(allowed.rescheduleAt).toBeInstanceOf(Date);
  });

  test("daily cap blocks additional deliveries", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ ...profile, notifications: { ...profile.notifications, quietHours: { enabled: false } } });
    jest.spyOn(LifeEvent, "findOne").mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    jest.spyOn(LifeHabit, "findOne").mockResolvedValue({ status: "active" });
    jest.spyOn(LifeNotificationDelivery, "countDocuments").mockResolvedValue(3);
    await expect(notificationService.eligibility({ user: "user-a", itemType: "habit", itemId: "habit-a", occurrenceDate: "2026-08-11", channel: "in_app" }, new Date("2026-08-11T06:00:00Z"))).resolves.toEqual({ eligible: false, reason: "daily_cap" });
  });

  test("worker atomically claims each due job once and can recover stale locks", async () => {
    jest.spyOn(profileService, "getOrCreateProfile").mockResolvedValue({ ...profile, notifications: { ...profile.notifications, quietHours: { enabled: false } } });
    jest.spyOn(LifeEvent, "findOne").mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    jest.spyOn(LifeHabit, "findOne").mockResolvedValue({ status: "active" });
    jest.spyOn(LifeNotificationDelivery, "countDocuments").mockResolvedValue(0);
    jest.spyOn(LifeNotificationDelivery, "create").mockResolvedValue({});
    jest.spyOn(Notification, "create").mockResolvedValue({ _id: "notification-a" });
    jest.spyOn(LifeNotificationJob, "updateOne").mockResolvedValue({});
    let claimed = false;
    const claim = jest.spyOn(LifeNotificationJob, "findOneAndUpdate").mockImplementation((filter) => {
      if (!filter.dueAt) return Promise.resolve({});
      if (claimed) return Promise.resolve(null);
      claimed = true;
      return Promise.resolve({ _id: "job-a", user: "user-a", itemType: "habit", itemId: "habit-a", occurrenceDate: "2026-08-11", channel: "in_app", title: "Walk", message: "Ready?", attempts: 0, maxAttempts: 3 });
    });
    const result = await notificationService.processDueNotifications({ now: new Date("2026-08-11T06:00:00Z"), limit: 5 });
    expect(result.processed).toBe(1);
    expect(Notification.create).toHaveBeenCalledTimes(1);
    expect(claim.mock.calls[0][0].$and[0].$or).toEqual(expect.arrayContaining([expect.objectContaining({ state: "processing", lockedAt: expect.any(Object) })]));
  });
});
