jest.mock("../services/articleService", () => ({
  getArticleBySlug: jest.fn(),
  getArticles: jest.fn(),
}));
jest.mock("../services/entitlementService", () => ({
  resolveForUser: jest.fn(async (userId) => ({ entitlements: { premium_content: userId === "premium-user" } })),
  hasEntitlement: jest.fn((resolution, key) => Boolean(resolution?.entitlements?.[key])),
}));

const articleService = require("../services/articleService");
const articleController = require("../controllers/articleController");
const storyController = require("../controllers/storyController");

const response = () => ({
  statusCode: 200,
  headers: {},
  payload: null,
  status(code) { this.statusCode = code; return this; },
  set(values) { Object.assign(this.headers, values); return this; },
  json(value) { this.payload = value; return this; },
});

const call = async (handler, req) => {
  const res = response();
  let thrown;
  await handler(req, res, (error) => { thrown = error; });
  if (thrown) throw thrown;
  return res;
};

const premiumArticle = {
  title: "Protected Article",
  slug: "protected-article",
  body: "ARTICLE BODY MUST STAY SERVER SIDE",
  description: "Public description",
  accessLevel: "premium",
  contentType: "article",
  status: "published",
};
const premiumStory = {
  title: "Protected Story",
  slug: "protected-story",
  body: "STORY BODY MUST STAY SERVER SIDE",
  storySections: [{ type: "chapter", chapterTitle: "Private", body: "PRIVATE CHAPTER" }],
  storyLayout: "chapter-journey",
  accessLevel: "premium",
  contentType: "story",
  status: "published",
};

describe("Premium content controllers", () => {
  beforeEach(() => jest.clearAllMocks());

  test.each([
    ["anonymous", undefined, true],
    ["Free", { _id: "free-user" }, true],
    ["Premium", { _id: "premium-user" }, false],
  ])("Article detail API returns the correct %s representation", async (_viewer, user, preview) => {
    articleService.getArticleBySlug.mockResolvedValue(premiumArticle);
    const res = await call(articleController.getArticleBySlug.bind(articleController), { params: { slug: premiumArticle.slug }, user });
    expect(res.statusCode).toBe(200);
    expect(res.headers["Cache-Control"]).toBe("private, no-store");
    expect(res.payload.article.premiumRequired).toBe(preview);
    expect(JSON.stringify(res.payload).includes("ARTICLE BODY MUST STAY SERVER SIDE")).toBe(!preview);
  });

  test.each([
    ["anonymous", undefined, true],
    ["Free", { _id: "free-user" }, true],
    ["Premium", { _id: "premium-user" }, false],
  ])("Story detail API returns the correct %s representation without changing layout", async (_viewer, user, preview) => {
    articleService.getArticleBySlug.mockResolvedValue(premiumStory);
    const res = await call(storyController.getStoryBySlug.bind(storyController), { params: { slug: premiumStory.slug }, user });
    expect(res.statusCode).toBe(200);
    expect(res.payload.article.storyLayout).toBe("chapter-journey");
    expect(res.payload.article.premiumRequired).toBe(preview);
    expect(JSON.stringify(res.payload).includes("PRIVATE CHAPTER")).toBe(!preview);
  });

  test("Story redirect responses do not expose an Article through an alternate route", async () => {
    articleService.getArticleBySlug.mockResolvedValue(premiumArticle);
    const res = await call(storyController.getStoryBySlug.bind(storyController), { params: { slug: premiumArticle.slug } });
    expect(res.statusCode).toBe(400);
    expect(res.payload.redirect).toBe(true);
    expect(res.payload.article).toBeUndefined();
    expect(JSON.stringify(res.payload)).not.toContain("ARTICLE BODY MUST STAY SERVER SIDE");
  });
});
