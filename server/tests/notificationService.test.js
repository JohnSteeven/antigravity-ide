jest.mock("../models/Notification", () => ({ create: jest.fn() }));
jest.mock("../models/FormSchema", () => ({ countDocuments: jest.fn(), findOne: jest.fn() }));
jest.mock("../models/FormSubmission", () => jest.fn());
jest.mock("../services/versionControlService", () => ({ createSnapshot: jest.fn() }));

const Notification = require("../models/Notification");
const NotificationService = require("../notifications/NotificationService");
const FormSchema = require("../models/FormSchema");
const FormSubmission = require("../models/FormSubmission");
const VersionControlService = require("../services/versionControlService");
const FormService = require("../services/formService");

const ownerId = "507f1f77bcf86cd799439011";
const notificationId = "507f1f77bcf86cd799439012";

beforeEach(() => {
  jest.clearAllMocks();
  Notification.create.mockImplementation(async (data) => ({ _id: notificationId, ...data }));
});

describe("persisted in-app notifications", () => {
  test("persists the server-selected owner and unread message before reporting success", async () => {
    let persist;
    Notification.create.mockImplementation(() => new Promise((resolve) => { persist = resolve; }));
    let completed = false;
    const sending = NotificationService.send({ recipient: ownerId, subject: " Item approved ", message: " Ready to publish. " })
      .then((result) => { completed = true; return result; });
    await Promise.resolve();
    expect(completed).toBe(false);
    expect(Notification.create).toHaveBeenCalledWith({
      user: ownerId, title: "Item approved", message: "Ready to publish.", status: "unread", source: "site",
    });
    persist({ _id: notificationId });
    await expect(sending).resolves.toEqual({ ok: true, channel: "in_app", notificationId });
  });

  test("rejects a persistence failure instead of claiming delivery", async () => {
    Notification.create.mockRejectedValue(new Error("Storage unavailable"));
    await expect(NotificationService.send({ recipient: ownerId, subject: "Update", message: "Review item" }))
      .rejects.toThrow("Storage unavailable");
  });

  test.each([undefined, "", "reader@example.com", { $ne: null }])("rejects invalid account recipients: %p", async (userId) => {
    await expect(NotificationService.sendInApp({ userId, title: "Update", message: "Review item" }))
      .rejects.toMatchObject({ code: "NOTIFICATION_RECIPIENT_INVALID" });
    expect(Notification.create).not.toHaveBeenCalled();
  });

  test.each(["email", "slack", "web_push"])("does not fabricate delivery for unavailable %s", async (channel) => {
    await expect(NotificationService.send({ channel, recipient: ownerId, subject: "Update", message: "Review item" }))
      .rejects.toMatchObject({ code: "NOTIFICATION_CHANNEL_UNAVAILABLE" });
    expect(Notification.create).not.toHaveBeenCalled();
  });

  test.each([
    { title: " ", message: "Content" },
    { title: "Title", message: " " },
    { title: "x".repeat(201), message: "Content" },
    { title: "Title", message: "x".repeat(4001) },
  ])("rejects invalid content before persistence", async (content) => {
    await expect(NotificationService.sendInApp({ userId: ownerId, ...content }))
      .rejects.toMatchObject({ code: "NOTIFICATION_CONTENT_INVALID" });
    expect(Notification.create).not.toHaveBeenCalled();
  });
});

describe("form submission notification regression", () => {
  test.each([false, true])("returns the saved form submission when notification delivery fails=%s", async (deliveryFails) => {
    const save = jest.fn().mockResolvedValue(undefined);
    FormSchema.countDocuments.mockResolvedValue(1);
    FormSchema.findOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439013", key: "contact_us", title: "Contact", createdBy: ownerId,
      fields: [{ key: "email", label: "Email", required: true }], successMessage: "Received.",
    });
    FormSubmission.mockImplementation(function (data) { Object.assign(this, data, { _id: "submission-id", save }); });
    VersionControlService.createSnapshot.mockResolvedValue(undefined);
    if (deliveryFails) Notification.create.mockRejectedValue(new Error("Notification storage unavailable"));

    await expect(FormService.submitForm({ formKey: "contact_us", data: { email: "reader@example.com" }, req: {} }))
      .resolves.toEqual({ success: true, message: "Received.", submissionId: "submission-id" });
    expect(save).toHaveBeenCalledTimes(1);
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ user: ownerId, title: "New Lead: Contact" }));
  });
});
