const notificationSchedulerService = require("../services/notificationSchedulerService");
const User = require("../models/User");
const Article = require("../models/Article");
const Notification = require("../models/Notification");
const quotes = require("../data/quotes");

jest.mock("../models/User");
jest.mock("../models/Article");
jest.mock("../models/Notification");

describe("NotificationSchedulerService Unit Tests", () => {
  let dateSpy;
  let dateNowSpy;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (dateSpy) dateSpy.mockRestore();
    if (dateNowSpy) dateNowSpy.mockRestore();
  });

  const mockTime = (isoString, hourValue) => {
    if (dateSpy) dateSpy.mockRestore();
    if (dateNowSpy) dateNowSpy.mockRestore();

    const mockDate = new Date(isoString);
    mockDate.getHours = () => hourValue;

    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
    dateSpy = jest.spyOn(global, 'Date').mockImplementation((...args) => {
      if (args.length > 0) return new Date(...args);
      return mockDate;
    });
  };

  describe("Daily Quotes Handler", () => {
    test("should send quote and update user history when time matches and not sent today", async () => {
      const mockUser = {
        _id: "user-123",
        notificationPreferences: {
          dailyQuote: {
            enabled: true,
            time: { hour: 9, minute: 0 }
          },
          sentQuotes: [],
          lastQuoteSentAt: null
        },
        save: jest.fn().mockResolvedValue(true)
      };

      User.find.mockResolvedValue([mockUser]);
      Notification.create.mockResolvedValue({});

      mockTime("2026-07-21T09:30:00Z", 9);

      await notificationSchedulerService.handleDailyQuotes();

      expect(Notification.create).toHaveBeenCalledTimes(1);
      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        user: "user-123",
        type: "daily_quote"
      }));
      expect(mockUser.notificationPreferences.sentQuotes).toHaveLength(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test("should not send quote if it was already sent today (dedup guard)", async () => {
      const mockUser = {
        _id: "user-123",
        notificationPreferences: {
          dailyQuote: {
            enabled: true,
            time: { hour: 9, minute: 0 }
          },
          sentQuotes: ["quote-1"],
          lastQuoteSentAt: new Date("2026-07-21T09:00:00Z") // sent today
        },
        save: jest.fn().mockResolvedValue(true)
      };

      User.find.mockResolvedValue([mockUser]);
      Notification.create.mockResolvedValue({});

      mockTime("2026-07-21T09:45:00Z", 9);

      await notificationSchedulerService.handleDailyQuotes();

      expect(Notification.create).not.toHaveBeenCalled();
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    test("should reset sentQuotes history when all 100 quotes have been used", async () => {
      // Create a list of 100 quote IDs
      const allQuoteIds = quotes.map(q => q.id);
      
      const mockUser = {
        _id: "user-123",
        notificationPreferences: {
          dailyQuote: {
            enabled: true,
            time: { hour: 9, minute: 0 }
          },
          sentQuotes: allQuoteIds, // all 100 used
          lastQuoteSentAt: new Date("2026-07-20T09:00:00Z") // sent yesterday
        },
        save: jest.fn().mockResolvedValue(true)
      };

      User.find.mockResolvedValue([mockUser]);
      Notification.create.mockResolvedValue({});

      mockTime("2026-07-21T09:00:00Z", 9);

      await notificationSchedulerService.handleDailyQuotes();

      expect(Notification.create).toHaveBeenCalledTimes(1);
      // History should reset and contain only the newly sent quote
      expect(mockUser.notificationPreferences.sentQuotes.length).toBe(1);
      expect(mockUser.notificationPreferences.sentQuotes[0]).toBe(quotes[0].id);
    });
  });

  describe("Reading Reminders Handler", () => {
    test("should send reading reminder if user is inactive for >= 3 days", async () => {
      const mockUser = {
        _id: "user-123",
        notificationPreferences: {
          readingReminders: { enabled: true },
          lastActiveAt: new Date("2026-07-15T12:00:00Z"),
          lastReadingReminderSentAt: null
        },
        save: jest.fn().mockResolvedValue(true)
      };

      User.find.mockResolvedValue([mockUser]);
      Notification.create.mockResolvedValue({});

      await notificationSchedulerService.handleReadingReminders();

      expect(Notification.create).toHaveBeenCalledTimes(1);
      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        type: "reminder",
        title: "Reading Reminder"
      }));
      expect(mockUser.notificationPreferences.lastReadingReminderSentAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    test("should verify user query filters on reading reminders", async () => {
      User.find.mockResolvedValue([]);
      await notificationSchedulerService.handleReadingReminders();

      expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
        "notificationPreferences.readingReminders.enabled": true,
        "notificationPreferences.lastActiveAt": expect.any(Object)
      }));
    });
  });

  describe("Weekly Summary Handler", () => {
    test("should send weekly summary if 7 days elapsed since last summary", async () => {
      const mockUser = {
        _id: "user-123",
        notificationPreferences: {
          weeklySummary: { enabled: true },
          lastWeeklySummarySentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
        },
        save: jest.fn().mockResolvedValue(true)
      };

      User.find.mockResolvedValue([mockUser]);
      Article.countDocuments.mockResolvedValue(3);
      Article.find.mockResolvedValue([
        { title: "Story A", views: 10, likes: 5, isMustRead: true },
        { title: "Story B", views: 20, likes: 10 }
      ]);
      Notification.create.mockResolvedValue({});

      await notificationSchedulerService.handleWeeklySummary();

      expect(Notification.create).toHaveBeenCalledTimes(1);
      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        type: "summary",
        title: "Weekly Reading Summary"
      }));
      expect(mockUser.notificationPreferences.lastWeeklySummarySentAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
