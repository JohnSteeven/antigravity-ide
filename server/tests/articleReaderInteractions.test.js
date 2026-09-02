const fs = require("fs");
const path = require("path");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);
const read = (...parts) => fs.readFileSync(workspaceFile(...parts), "utf8");
const userId = "64b000000000000000000001";
const articleId = "64b000000000000000000002";

const articleCard = {
  _id: articleId,
  title: "Authoritative Article",
  slug: "authoritative-article",
  description: "Stored Article",
  category: "Coding",
  readingTime: "4 min read",
  publishedAt: new Date("2026-08-01T00:00:00.000Z"),
};

const loadReaderProfileService = ({ article = articleCard, profileAfter = {} } = {}) => {
  jest.resetModules();
  const articleQuery = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(article),
  };
  const ReaderProfile = {
    findOneAndUpdate: jest.fn()
      .mockResolvedValueOnce({ userId })
      .mockResolvedValueOnce(profileAfter),
  };
  const Article = {
    collection: { name: "articles" },
    findOne: jest.fn(() => articleQuery),
  };

  jest.doMock("../models/ReaderProfile", () => ReaderProfile);
  jest.doMock("../models/ReadingProgress", () => ({}));
  jest.doMock("../models/Article", () => Article);
  jest.doMock("../models/ReadingCollection", () => ({}));
  jest.doMock("../models/LearningPath", () => ({}));

  return {
    service: require("../services/readerProfileService"),
    Article,
    ReaderProfile,
  };
};

describe("authoritative ReaderProfile Article toggles", () => {
  afterEach(() => jest.restoreAllMocks());

  test.each([
    ["likedArticles", "like"],
    ["bookmarks", "bookmark"],
    ["savedArticles", "save"],
  ])("%s persists a published Article and returns its library DTO", async (field) => {
    const runtime = loadReaderProfileService({ profileAfter: { [field]: [articleId] } });
    const result = await runtime.service.toggleArticleReference(userId, field, articleId);

    expect(runtime.Article.findOne).toHaveBeenCalledWith({
      _id: expect.anything(),
      contentType: "article",
      status: "published",
      isDeleted: false,
    });
    expect(result).toMatchObject({
      isAdded: true,
      libraryItem: { id: articleId, title: articleCard.title, slug: articleCard.slug },
    });
  });

  test("the atomic conditional prevents duplicate likes and removes an existing like", async () => {
    const addRuntime = loadReaderProfileService({ profileAfter: { likedArticles: [articleId] } });
    await addRuntime.service.toggleArticleReference(userId, "likedArticles", articleId);
    const [, pipeline] = addRuntime.ReaderProfile.findOneAndUpdate.mock.calls[1];
    const toggle = pipeline[0].$set.likedArticles.$cond;

    expect(toggle[0]).toHaveProperty("$in");
    expect(toggle[1]).toHaveProperty("$filter");
    expect(toggle[2]).toHaveProperty("$concatArrays");

    const removeRuntime = loadReaderProfileService({ profileAfter: { likedArticles: [] } });
    const removed = await removeRuntime.service.toggleArticleReference(userId, "likedArticles", articleId);
    expect(removed.isAdded).toBe(false);
  });

  test("a Story cannot enter any Article Reader library", async () => {
    const runtime = loadReaderProfileService({ article: null });
    await expect(runtime.service.toggleArticleReference(userId, "bookmarks", articleId))
      .rejects.toMatchObject({ status: 404, message: "Published Article not found." });
    expect(runtime.ReaderProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("an invalid Article identifier fails validation before any Mongo write", async () => {
    const runtime = loadReaderProfileService();
    await expect(runtime.service.toggleArticleReference(userId, "savedArticles", "not-an-object-id"))
      .rejects.toMatchObject({ status: 422, message: "Invalid identifier." });
    expect(runtime.Article.findOne).not.toHaveBeenCalled();
    expect(runtime.ReaderProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

const loadArticleService = ({ isAdded, count, metric }) => {
  jest.resetModules();
  const articleRepository = {
    updateEngagementCounter: jest.fn().mockResolvedValue({ _id: articleId, [metric]: count }),
  };
  const toggleArticleReference = jest.fn().mockResolvedValue({
    isAdded,
    libraryItem: { id: articleId, title: articleCard.title, slug: articleCard.slug },
  });
  jest.doMock("../repositories/articleRepository", () => articleRepository);
  jest.doMock("../repositories/activityLogRepository", () => ({}));
  jest.doMock("../models/Category", () => ({}));
  jest.doMock("../models/Article", () => ({}));
  jest.doMock("../services/readerProfileService", () => ({ toggleArticleReference }));
  return { service: require("../services/articleService"), articleRepository, toggleArticleReference };
};

describe("Article engagement service contract", () => {
  test.each([
    ["likes", "likedArticles"],
    ["bookmarks", "bookmarks"],
    ["saved", "savedArticles"],
  ])("%s additions update ReaderProfile and the counter atomically", async (metric, readerField) => {
    const runtime = loadArticleService({ isAdded: true, count: 1, metric });
    const result = await runtime.service.incrementMetric(articleId, metric, userId);

    expect(runtime.toggleArticleReference).toHaveBeenCalledWith(userId, readerField, articleId);
    expect(runtime.articleRepository.updateEngagementCounter).toHaveBeenCalledWith(articleId, metric, 1);
    expect(result).toMatchObject({ isActive: true, article: { [metric]: 1 } });
  });

  test("unlike removes Reader state and decrements without client-side guessing", async () => {
    const runtime = loadArticleService({ isAdded: false, count: 0, metric: "likes" });
    const result = await runtime.service.incrementMetric(articleId, "likes", userId);
    expect(runtime.articleRepository.updateEngagementCounter).toHaveBeenCalledWith(articleId, "likes", -1);
    expect(result.isActive).toBe(false);
    expect(result.article.likes).toBe(0);
  });

  test("the repository clamps counter decrements at zero in one Mongo update", () => {
    const repository = read("server", "repositories", "articleRepository.js");
    expect(repository).toContain("async updateEngagementCounter(id, metric, delta)");
    expect(repository).toContain("$max: [0, { $add:");
    expect(repository).not.toContain("let newValue");
  });
});

describe("Article interaction API and client contract", () => {
  test("controllers return one authoritative state/count/library-item shape", async () => {
    jest.resetModules();
    const incrementMetric = jest.fn(async (id, metric, ownerId) => ({
      article: { _id: id, [metric]: 1 },
      isActive: true,
      libraryItem: { id, title: articleCard.title, slug: articleCard.slug },
      ownerId,
    }));
    jest.doMock("../services/articleService", () => ({ incrementMetric }));
    jest.doMock("../services/commentService", () => ({}));
    const controller = require("../controllers/articleController");
    const response = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis() });

    for (const [handler, metric] of [["likeArticle", "likes"], ["bookmarkArticle", "bookmarks"], ["saveArticle", "saved"]]) {
      const res = response();
      await controller[handler]({ params: { id: articleId }, user: { _id: userId }, body: { userId: "attacker" } }, res, jest.fn());
      expect(incrementMetric).toHaveBeenLastCalledWith(articleId, metric, userId);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        articleId,
        metric,
        isActive: true,
        count: 1,
        libraryItem: expect.objectContaining({ id: articleId }),
      }));
    }
  });

  test("all protected interaction routes use authenticated server identity", () => {
    const routes = read("server", "routes", "articleRoutes.js");
    const controller = read("server", "controllers", "articleController.js");
    expect(routes).toContain('router.post("/:id/like", authenticate, articleController.likeArticle)');
    expect(routes).toContain('router.post("/:id/bookmark", authenticate, articleController.bookmarkArticle)');
    expect(routes).toContain('router.post("/:id/save", authenticate, articleController.saveArticle)');
    expect(controller).toContain('req.params.id, "likes", req.user._id');
    expect(controller).not.toMatch(/req\.body\.userId/);
  });

  test("ArticleDetail uses the service response to synchronize ReaderContext and Profile lists", () => {
    const detail = read("src", "components", "ArticleDetail.js");
    const content = read("src", "context", "ContentCmsContext.js");
    const reader = read("src", "context", "ReaderContext.js");
    const readingTab = read("src", "components", "profile", "ReadingTab.jsx");
    const savedTab = read("src", "components", "profile", "SavedTab.jsx");

    expect(content).toContain("async incrementArticle(id, metric)");
    expect(content).toContain("if (response?.count !== undefined) applyUpdate(response.count)");
    expect(detail).toContain('response?.metric !== metric');
    expect(detail).toContain('typeof response?.isActive !== "boolean"');
    expect(detail).toContain("applyAuthoritativeLibraryState");
    expect(detail).not.toContain("refreshReader");
    expect(reader).toContain("[collection]: isActive ? [...withoutArticle, article] : withoutArticle");
    expect(reader).toContain("libraryVersionAtRequest");
    expect(readingTab).toContain("count: library.liked.length");
    expect(savedTab).toContain("items: library.bookmarked");
    expect(savedTab).toContain("items: library.saved");
  });

  test("active client controls contain no legacy User.profile library reads", () => {
    const activeControls = [
      read("src", "components", "ArticleDetail.js"),
      read("src", "features", "categories", "CategoryLanding.js"),
      read("src", "landings", "coding", "CodingLanding.js"),
      read("src", "landings", "life", "LifeLanding.js"),
    ].join("\n");
    const detail = read("src", "components", "ArticleDetail.js");
    expect(activeControls).not.toMatch(/profile\?*\.(likedArticles|bookmarks|savedArticles)/);
    expect(activeControls).not.toContain("refreshSession");
    expect(activeControls.match(/applyAuthoritativeLibraryState/g).length).toBeGreaterThanOrEqual(4);
    expect(detail).toContain("library.liked.some");
    expect(detail).toContain("library.bookmarked.some");
    expect(detail).toContain("library.saved.some");
  });

  test("toggle controls expose pending and accessible pressed state with visible feedback", () => {
    const bar = read("src", "experiences", "shared", "widgets", "EngagementBar.js");
    const detail = read("src", "components", "ArticleDetail.js");
    expect(bar.match(/aria-pressed=/g)).toHaveLength(3);
    expect(bar).toContain("disabled={actionsPending}");
    expect(bar).toContain('aria-label="Share article"');
    expect(detail).toContain('role={interactionFeedback.type === "error" ? "alert" : "status"}');
    expect(detail).toContain('message: "Could not copy the link."');
  });
});

describe("Article sharing behavior", () => {
  const { copyToClipboard, shareArticle } = require("../../src/utils/articleSharing.cjs");

  test("uses native share when it is available", async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    const writeText = jest.fn();
    const result = await shareArticle({
      title: articleCard.title,
      url: "https://example.test/articles/authoritative-article",
      navigatorObject: { share, clipboard: { writeText } },
    });
    expect(share).toHaveBeenCalledWith({
      title: articleCard.title,
      url: "https://example.test/articles/authoritative-article",
    });
    expect(writeText).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, method: "native" });
  });

  test("falls back to clipboard when native share is unavailable or fails", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    await expect(shareArticle({
      title: articleCard.title,
      url: "https://example.test/articles/authoritative-article",
      navigatorObject: { clipboard: { writeText } },
    })).resolves.toEqual({ ok: true, method: "clipboard" });
    expect(writeText).toHaveBeenCalledTimes(1);

    const failedShare = jest.fn().mockRejectedValue(new Error("provider failed"));
    await expect(shareArticle({
      title: articleCard.title,
      url: "https://example.test/articles/authoritative-article",
      navigatorObject: { share: failedShare, clipboard: { writeText } },
    })).resolves.toEqual({ ok: true, method: "clipboard" });
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  test("reports clipboard failure instead of silently claiming success", async () => {
    const textArea = { style: {}, focus: jest.fn(), select: jest.fn(), remove: jest.fn() };
    const documentObject = {
      body: { appendChild: jest.fn() },
      createElement: jest.fn(() => textArea),
      execCommand: jest.fn(() => false),
    };
    await expect(copyToClipboard("https://example.test", { navigatorObject: {}, documentObject }))
      .resolves.toBe(false);
    await expect(shareArticle({
      url: "https://example.test",
      navigatorObject: {},
      documentObject,
    })).resolves.toEqual({ ok: false, method: "failed" });
  });

  test("the handler shares a canonical URL without localhost hardcoding", () => {
    const detail = read("src", "components", "ArticleDetail.js");
    expect(detail).toContain('canonicalUrl.search = ""');
    expect(detail).toContain('canonicalUrl.hash = ""');
    expect(detail).toContain("preferNative: !forceCopy");
    expect(detail).not.toContain("http://localhost");
  });
});
