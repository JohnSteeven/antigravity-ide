const mongoose = require("mongoose");
const express = require("express");
const request = require("supertest");

jest.mock("../models/Notification", () => ({
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock("../middleware/auth", () => ({
  authenticate: (req, res, next) => {
    const userId = req.get("x-test-user");
    if (!userId) return res.status(401).json({ message: "Authentication required." });
    req.user = { _id: userId, role: "Reader", status: "ACTIVE" };
    return next();
  },
}));

const Notification = require("../models/Notification");
const NotificationService = require("../notifications/NotificationService");
const retentionService = require("../learn/retentionService");
const userRoutes = require("../routes/userRoutes");

const userA = new mongoose.Types.ObjectId().toString();
const userB = new mongoose.Types.ObjectId().toString();
const notificationId = new mongoose.Types.ObjectId().toString();

const listQuery = (items) => ({
  sort: jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(items),
    }),
  }),
});

const updateQuery = (item) => ({ lean: jest.fn().mockResolvedValue(item) });

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);
app.use((error, _req, res, _next) => {
  res.status(error.status || 500).json({ message: error.message, code: error.code });
});

describe("Phase 9 notification foundation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Notification.find.mockReturnValue(listQuery([]));
    Notification.countDocuments.mockResolvedValue(0);
    Notification.updateMany.mockResolvedValue({ modifiedCount: 0 });
  });

  test("authenticated APIs reject anonymous notification access", async () => {
    await request(app).get("/api/users/notifications").expect(401);
    expect(Notification.find).not.toHaveBeenCalled();
  });

  test("list and unread count are scoped only to the authenticated owner", async () => {
    Notification.find.mockReturnValue(listQuery([
      {
        _id: notificationId,
        user: userA,
        type: "achievement_unlocked",
        title: "First lesson",
        message: "You completed your first lesson.",
        status: "unread",
        createdAt: new Date("2026-09-27T10:00:00.000Z"),
      },
    ]));
    Notification.countDocuments.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/users/notifications")
      .set("x-test-user", userA)
      .expect(200);

    expect(Notification.find).toHaveBeenCalledWith({ user: userA });
    expect(Notification.countDocuments).toHaveBeenCalledWith({ user: userA, status: "unread" });
    expect(response.body.data.unreadCount).toBe(1);
    expect(response.body.data.items[0]).not.toHaveProperty("user");

    const countResponse = await request(app)
      .get("/api/users/notifications/unread-count")
      .set("x-test-user", userB)
      .expect(200);
    expect(Notification.countDocuments).toHaveBeenLastCalledWith({ user: userB, status: "unread" });
    expect(countResponse.body.data.unreadCount).toBe(1);
  });

  test("mark one read cannot mutate another user's notification", async () => {
    Notification.findOneAndUpdate.mockReturnValue(updateQuery(null));
    const response = await request(app)
      .patch(`/api/users/notifications/${notificationId}`)
      .set("x-test-user", userA)
      .expect(404);

    expect(response.body.code).toBe("NOTIFICATION_NOT_FOUND");
    expect(Notification.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: notificationId, user: userA });
  });

  test("mark one read returns the owner-scoped updated notification", async () => {
    const readAt = new Date();
    Notification.findOneAndUpdate.mockReturnValue(updateQuery({
      _id: notificationId,
      user: userA,
      title: "Course completed",
      message: "You completed a course.",
      type: "course_completed",
      status: "read",
      readAt,
      createdAt: readAt,
    }));

    const response = await request(app)
      .patch(`/api/users/notifications/${notificationId}`)
      .set("x-test-user", userA)
      .expect(200);

    expect(response.body.data.notification).toMatchObject({ id: notificationId, read: true, status: "read" });
  });

  test("mark all read updates only unread notifications owned by the requester", async () => {
    Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });
    const response = await request(app)
      .patch("/api/users/notifications/read-all")
      .set("x-test-user", userA)
      .expect(200);

    expect(Notification.updateMany.mock.calls[0][0]).toEqual({ user: userA, status: "unread" });
    expect(response.body.data).toEqual({ modifiedCount: 3, unreadCount: 0 });
  });

  test("milestone creation uses a recipient-scoped idempotency key", async () => {
    const saved = { _id: notificationId };
    Notification.findOneAndUpdate.mockResolvedValue(saved);
    const input = {
      userId: userA,
      type: "streak_milestone",
      title: "3-Day Learning Streak",
      message: "Built learning momentum with 3 consecutive active days.",
      actionUrl: "/learn",
      relatedEntityType: "achievement",
      relatedEntityKey: "streak_3",
      dedupeKey: "learning:achievement:streak_3",
    };

    await NotificationService.createProductNotification(input);
    await NotificationService.createProductNotification(input);

    expect(Notification.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(Notification.findOneAndUpdate.mock.calls[0][0]).toEqual({
      user: userA,
      dedupeKey: "learning:achievement:streak_3",
    });
    expect(Notification.findOneAndUpdate.mock.calls[0][2]).toMatchObject({ upsert: true, new: true });
    expect(Notification.findOneAndUpdate.mock.calls[1][0]).toEqual(Notification.findOneAndUpdate.mock.calls[0][0]);
  });

  test("page views and external action URLs cannot create product notifications", async () => {
    await expect(NotificationService.createProductNotification({
      userId: userA,
      type: "page_view",
      title: "Viewed",
      message: "A page was opened.",
      dedupeKey: "page-view:1",
    })).rejects.toMatchObject({ code: "NOTIFICATION_TYPE_INVALID" });

    await expect(NotificationService.createProductNotification({
      userId: userA,
      type: "achievement_unlocked",
      title: "Achievement",
      message: "Unlocked.",
      actionUrl: "https://example.com/phishing",
      dedupeKey: "achievement:unsafe",
    })).rejects.toMatchObject({ code: "NOTIFICATION_ACTION_INVALID" });
    expect(Notification.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("unified Learn and Coding achievements emit idempotent milestone notifications", async () => {
    Notification.findOneAndUpdate.mockResolvedValue({ _id: notificationId });
    const emitted = await retentionService.notifyNewAchievements({
      userId: userA,
      existingAchievementKeys: new Set(["first_lesson"]),
      achievements: [
        { key: "first_lesson", title: "First Lesson", description: "Done.", unlocked: true },
        { key: "first_exercise", title: "First Exercise", description: "Passed coding exercise.", unlocked: true },
        { key: "streak_3", title: "3-Day Learning Streak", description: "Three active days.", unlocked: true },
      ],
    });

    expect(emitted).toBe(2);
    const payloads = Notification.findOneAndUpdate.mock.calls.map((call) => call[1].$setOnInsert);
    expect(payloads.map((payload) => payload.type)).toEqual(["achievement_unlocked", "streak_milestone"]);
    expect(payloads.map((payload) => payload.dedupeKey)).toEqual([
      "learning:achievement:first_exercise",
      "learning:achievement:streak_3",
    ]);
  });
});
