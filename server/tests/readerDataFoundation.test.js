const fs = require("fs");
const path = require("path");
const express = require("express");
const request = require("supertest");
const { validationResult } = require("express-validator");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);
const read = (...parts) => fs.readFileSync(workspaceFile(...parts), "utf8");

describe("Reader data ownership", () => {
  test("User owns account profile fields while ReaderProfile owns Article library state", () => {
    const User = require("../models/User");
    const ReaderProfile = require("../models/ReaderProfile");

    expect(User.schema.path("profile.location")).toBeDefined();
    expect(User.schema.path("profile.website")).toBeDefined();
    expect(User.schema.path("profile.bookmarks")).toBeUndefined();
    expect(User.schema.path("profile.likedArticles")).toBeUndefined();
    expect(User.schema.path("profile.savedArticles")).toBeUndefined();
    expect(User.schema.path("profile.comments")).toBeUndefined();
    expect(ReaderProfile.schema.path("bookmarks")).toBeDefined();
    expect(ReaderProfile.schema.path("likedArticles")).toBeDefined();
    expect(ReaderProfile.schema.path("savedArticles")).toBeDefined();
    expect(ReaderProfile.schema.path("notifications")).toBeUndefined();
  });

  test("ReadingProgress declares the authoritative fields and partial unique identity", () => {
    const ReadingProgress = require("../models/ReadingProgress");
    const indexes = ReadingProgress.schema.indexes();
    const authorityIndex = indexes.find(([keys]) => keys.userId === 1 && keys.articleId === 1);

    expect(ReadingProgress.schema.path("progressPercent")).toBeDefined();
    expect(ReadingProgress.schema.path("furthestProgressPercent")).toBeDefined();
    expect(ReadingProgress.schema.path("lastPosition")).toBeDefined();
    expect(ReadingProgress.schema.path("activeReadingSeconds")).toBeDefined();
    expect(ReadingProgress.schema.path("completedAt")).toBeDefined();
    expect(ReadingProgress.schema.path("completionSource")).toBeDefined();
    expect(authorityIndex[1]).toMatchObject({
      unique: true,
      name: "uniq_reader_progress_user_article",
      partialFilterExpression: { userId: { $type: "objectId" } },
    });
  });
});

const loadProgressService = ({ article = { _id: "64b000000000000000000002" }, progressRows = [] } = {}) => {
  jest.resetModules();
  const articleQuery = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(article),
  };
  const ownedQuery = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockImplementation(async () => progressRows.shift() || null),
  };
  const ReadingProgress = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(() => ownedQuery),
    find: jest.fn(),
  };
  const ReaderProfile = { findOneAndUpdate: jest.fn() };
  const evaluateAchievements = jest.fn();

  jest.doMock("../models/Article", () => ({ findOne: jest.fn(() => articleQuery) }));
  jest.doMock("../models/ReadingProgress", () => ReadingProgress);
  jest.doMock("../models/ReaderProfile", () => ReaderProfile);
  jest.doMock("../services/achievementService", () => ({ evaluateAchievements }));

  return {
    service: require("../services/readingProgressService"),
    Article: require("../models/Article"),
    ReadingProgress,
    ReaderProfile,
    evaluateAchievements,
  };
};

describe("atomic ReadingProgress behavior", () => {
  const userId = "64b000000000000000000001";
  const articleId = "64b000000000000000000002";
  const populated = (overrides = {}) => ({
    _id: "64b000000000000000000003",
    articleId: { _id: articleId, title: "Real Article", slug: "real-article", contentType: "article" },
    progressPercent: 40,
    furthestProgressPercent: 40,
    lastPosition: 500,
    activeReadingSeconds: 12,
    isCompleted: false,
    lastReadAt: new Date(),
    ...overrides,
  });

  afterEach(() => jest.restoreAllMocks());

  test("uses atomic max/inc/set operators so progress cannot regress", async () => {
    const runtime = loadProgressService({ progressRows: [populated()] });
    runtime.ReadingProgress.findOneAndUpdate.mockResolvedValueOnce(populated());

    const result = await runtime.service.updateProgress({
      userId,
      articleId,
      progressPercent: 40,
      lastPosition: 500,
      activeReadingSeconds: 12,
    });

    expect(runtime.ReadingProgress.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ userId: expect.anything(), articleId: expect.anything() }),
      expect.objectContaining({
        $max: { progressPercent: 40, furthestProgressPercent: 40, lastPosition: 500 },
        $inc: { activeReadingSeconds: 12 },
        $set: { lastReadAt: expect.any(Date) },
      }),
      expect.objectContaining({ new: true, upsert: true })
    );
    expect(result).toMatchObject({ progressPercent: 40, activeReadingSeconds: 12, continueUrl: "/articles/real-article" });
  });

  test("completion is compare-and-set and persists its source and timestamp", async () => {
    const completed = populated({
      progressPercent: 90,
      furthestProgressPercent: 90,
      isCompleted: true,
      completedAt: new Date(),
      completionSource: "auto",
    });
    const runtime = loadProgressService({ progressRows: [completed] });
    runtime.ReadingProgress.findOneAndUpdate
      .mockResolvedValueOnce(populated({ progressPercent: 90 }))
      .mockResolvedValueOnce(completed);
    jest.spyOn(runtime.service, "onArticleCompleted").mockResolvedValue(undefined);

    const result = await runtime.service.updateProgress({ userId, articleId, progressPercent: 90 });

    expect(runtime.ReadingProgress.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ isCompleted: false }),
      { $set: expect.objectContaining({ isCompleted: true, completedAt: expect.any(Date), completionSource: "auto" }) },
      expect.objectContaining({ new: true })
    );
    expect(runtime.service.onArticleCompleted).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ isCompleted: true, completionSource: "auto" });
  });

  test("rejects Stories before any progress record can be written", async () => {
    const runtime = loadProgressService({ article: null });
    await expect(runtime.service.updateProgress({ userId, articleId, progressPercent: 10 }))
      .rejects.toMatchObject({ status: 404, message: "Published Article not found." });
    expect(runtime.ReadingProgress.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe("Reader/Profile response privacy", () => {
  test("returns an allowlisted account DTO and real Reader summary without security fields", async () => {
    jest.resetModules();
    const profile = {
      favoriteCategories: ["Coding"],
      preferredLanguage: "en",
      themePreference: "dark",
      bookmarks: [], likedArticles: [], savedArticles: [],
      currentStreakDays: 2, longestStreakDays: 5, lastActiveDate: new Date(),
      readingGoal: { articlesPerWeekTarget: 4, minutesPerDayTarget: 15 },
      achievements: [],
    };
    const lean = jest.fn().mockResolvedValue(profile);
    jest.doMock("../models/ReaderProfile", () => ({
      findOneAndUpdate: jest.fn(() => ({ lean })),
    }));
    jest.doMock("../models/ReadingProgress", () => ({
      aggregate: jest.fn().mockResolvedValue([{ articlesRead: 3, activeReadingSeconds: 125, articlesReadThisWeek: 2 }]),
    }));
    jest.doMock("../models/Article", () => ({ collection: { name: "articles" }, find: jest.fn() }));
    jest.doMock("../models/ReadingCollection", () => ({}));
    jest.doMock("../models/LearningPath", () => ({}));
    const service = require("../services/readerProfileService");
    const result = await service.getProfileContract({
      _id: "64b000000000000000000001",
      firstName: "Reader",
      lastName: "One",
      username: "reader-one",
      email: "private@example.test",
      passwordHash: "secret",
      twoFactor: { secret: "private" },
      notificationPreferences: { sentQuotes: ["private"] },
      profile: { bio: "Hello", location: "Chennai", website: "", skills: [] },
    });

    expect(result.account).toEqual(expect.objectContaining({ firstName: "Reader", username: "reader-one" }));
    expect(result.account).not.toHaveProperty("email");
    expect(result.account).not.toHaveProperty("passwordHash");
    expect(result.account).not.toHaveProperty("twoFactor");
    expect(result.account).not.toHaveProperty("notificationPreferences");
    expect(result.reader.readingSummary).toEqual({ articlesRead: 3, activeReadingSeconds: 125 });
    expect(result.reader.achievements).toEqual([]);
  });
});

describe("Profile persistence and notification contract", () => {
  test("all server-advertised daily quote slots validate and unadvertised slots fail", async () => {
    const { updateProfileValidator } = require("../validators/userValidator");
    const { DAILY_QUOTE_TIME_SLOTS } = require("../config/notificationPreferences");
    const app = express();
    app.use(express.json());
    app.post("/", updateProfileValidator, (req, res) => {
      const errors = validationResult(req);
      res.status(errors.isEmpty() ? 200 : 422).json({ errors: errors.array() });
    });

    for (const slot of DAILY_QUOTE_TIME_SLOTS) {
      const response = await request(app).post("/").send({
        notificationPreferences: { dailyQuote: { time: { hour: slot.hour, minute: slot.minute } } },
      });
      expect(response.status).toBe(200);
    }
    expect((await request(app).post("/").send({ notificationPreferences: { dailyQuote: { time: { hour: 7, minute: 0 } } } })).status).toBe(422);
  });

  test("active Profile sources real Reader data and contains no fabricated activity", () => {
    const overview = read("src", "components", "profile", "OverviewTab.jsx");
    const reading = read("src", "components", "profile", "ReadingTab.jsx");
    const saved = read("src", "components", "profile", "SavedTab.jsx");
    const article = read("src", "components", "ArticleDetail.js");
    const settings = read("src", "components", "profile", "SettingsTab.jsx");

    expect(overview).toContain("No achievements yet");
    expect(overview).toContain("tracked active Article reading time");
    expect(overview).not.toContain("DEFAULT_BADGES");
    expect(overview).not.toContain("Mins Saved");
    expect(reading).toContain("item.furthestProgressPercent");
    expect(reading).toContain("item.completedAt");
    expect(reading).not.toContain("draft-sample");
    expect(reading).not.toContain("profile.comments");
    expect(saved).not.toContain("Must Reads");
    expect(saved).not.toContain("Personal Growth");
    expect(article).toContain("useArticleReadingProgress");
    expect(article).not.toContain("profile-comment-");
    expect(settings).toContain("contracts.dailyQuoteTimeSlots.map");
    expect(settings).not.toContain("<option value={7}>");
    expect(fs.existsSync(workspaceFile("src", "components", "ReaderDashboard.jsx"))).toBe(false);
  });
});
