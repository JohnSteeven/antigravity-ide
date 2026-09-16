const fs = require("fs");
const path = require("path");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);
const read = (...parts) => fs.readFileSync(workspaceFile(...parts), "utf8");

describe("Article interactions: Optimistic UI, silent success, and resilience", () => {
  test("EngagementBar has zero disruptive 'Updating…' labels and keeps buttons responsive", () => {
    const bar = read("src", "experiences", "shared", "widgets", "EngagementBar.js");
    expect(bar).not.toMatch(/pendingAction === "like" \? "Updating…"/);
    expect(bar).not.toMatch(/pendingAction === "bookmark" \? "Updating…"/);
    expect(bar).not.toMatch(/pendingAction === "save" \? "Updating…"/);
    expect(bar).toContain("<span>{Number(article.likes || 0).toLocaleString()}</span>");
    expect(bar).toContain("<span>{Number(article.bookmarks || 0).toLocaleString()}</span>");
    expect(bar).toContain('<span>{isSaved ? "Saved ✓" : "Save"}</span>');
    expect(bar).toContain('disabled={actionsPending}');
  });

  test("ArticleDetail implements optimistic state toggle, silent success, and failure rollback", () => {
    const detail = read("src", "components", "ArticleDetail.js");
    expect(detail).toContain("const inFlightInteractions = useRef(new Set())");
    expect(detail).toContain("inFlightInteractions.current.add(lockKey)");
    expect(detail).toContain("inFlightInteractions.current.delete(lockKey)");
    // Optimistic application before network
    expect(detail).toContain("setApiArticle((current) => current ? { ...current, [metric]: optimisticCount } : null)");
    // Silent success: no repetitive success toast
    expect(detail).not.toMatch(/setInteractionFeedback\(\{\s*type:\s*"status",\s*message:\s*response\.isActive \? activeMessage/);
    // Rollback on failure
    expect(detail).toContain("setApiArticle((current) => current ? { ...current, [metric]: previousCount } : null)");
    expect(detail).toContain("isActive: wasActive");
    expect(detail).toContain('setInteractionFeedback({ type: "error", message }');
  });

  test("Category, Life, and Coding landing featured cards have zero 'Updating…' labels and silent success", () => {
    const files = [
      read("src", "features", "categories", "CategoryLanding.js"),
      read("src", "landings", "life", "LifeLanding.js"),
      read("src", "landings", "coding", "CodingLanding.js"),
    ];

    for (const content of files) {
      expect(content).not.toContain('"Updating…"');
      expect(content).toContain("inFlightLanding");
      expect(content).not.toContain('setMessage(active ? "Article liked." : "Article unliked.")');
      expect(content).not.toContain('setMessage(active ? "Article bookmarked." : "Article removed from bookmarks.")');
      expect(content).toContain("setEngagementCounts((current) => ({ ...current, [metric]: nextCount }))");
      expect(content).toContain("setEngagementCounts((current) => ({ ...current, [metric]: prevCount }))");
    }
  });

  test("ContentCmsContext incrementArticle is decoupled from admin CMS scope", () => {
    const content = read("src", "context", "ContentCmsContext.js");
    expect(content).not.toContain("runForActiveScope(activeScopeRef, () => articleApi.incrementViews");
    expect(content).not.toContain("runForActiveScope(activeScopeRef, () => requestInteraction");
    expect(content).toContain("const response = await articleApi.incrementViews(id)");
    expect(content).toContain("const response = await requestInteraction(id)");
  });

  test("articleService.incrementMetric resolves slug to ObjectId when slug identifier is passed", async () => {
    jest.resetModules();
    const mockArticle = {
      _id: "64b000000000000000000099",
      slug: "slug-article",
      likes: 5,
    };
    const Article = {
      findOne: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: mockArticle._id }),
      })),
    };
    const articleRepository = {
      updateEngagementCounter: jest.fn().mockResolvedValue({ ...mockArticle, likes: 6 }),
      incrementPublishedArticleView: jest.fn().mockResolvedValue({ ...mockArticle, views: 10 }),
    };
    const ReaderProfileService = {
      toggleArticleReference: jest.fn().mockResolvedValue({
        isAdded: true,
        libraryItem: { id: mockArticle._id, title: "Slug Article", slug: "slug-article" },
      }),
    };

    jest.doMock("../models/Article", () => Article);
    jest.doMock("../repositories/articleRepository", () => articleRepository);
    jest.doMock("../services/readerProfileService", () => ReaderProfileService);
    jest.doMock("../repositories/activityLogRepository", () => ({}));
    jest.doMock("../models/Category", () => ({}));

    const service = require("../services/articleService");
    const result = await service.incrementMetric("slug-article", "likes", "64b000000000000000000001");

    expect(Article.findOne).toHaveBeenCalledWith({
      slug: "slug-article",
      contentType: "article",
      status: "published",
      isDeleted: false,
    });
    expect(ReaderProfileService.toggleArticleReference).toHaveBeenCalledWith(
      "64b000000000000000000001",
      "likedArticles",
      mockArticle._id
    );
    expect(articleRepository.updateEngagementCounter).toHaveBeenCalledWith(mockArticle._id, "likes", 1);
    expect(result.isActive).toBe(true);
    expect(result.article.likes).toBe(6);
  });
});

