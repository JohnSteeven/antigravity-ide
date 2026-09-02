const fs = require("fs");
const path = require("path");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

describe("Article client authority and scalability contracts", () => {
  test("persistent Article and taxonomy state never initializes or restores from bundled fixtures", () => {
    const context = read("src", "context", "ContentCmsContext.js");
    expect(context).toContain("const [articles, setArticles] = useState([])");
    expect(context).toContain("const [categories, setCategories] = useState([])");
    expect(context).not.toContain("useState(cmsSeed.articles)");
    expect(context).not.toMatch(/JSON\.stringify\(\{[^}]*articles/);
    expect(context).toContain('setSyncStatus("unavailable")');
    expect(context).toContain('user?.role === "Admin"');
    expect(context).toContain('error.code = "ARTICLE_NOT_PERSISTED"');
  });

  test("the public listing uses bounded server pagination with explicit failure UX", () => {
    const listing = read("src", "components", "ArticlesPage.js");
    expect(listing).toContain("const PAGE_SIZE = 12");
    expect(listing).toContain("page, limit: PAGE_SIZE, sort");
    expect(listing).toContain("response?.pagination");
    expect(listing).toContain("Retry");
    expect(listing).not.toContain("limit: 1000");
    expect(listing).not.toContain("fall back to CmsContext");
    expect(listing).not.toContain("sortArticlesLocal");
  });

  test("Article detail body and engagement counts remain API-authoritative", () => {
    const detail = read("src", "components", "ArticleDetail.js");
    expect(detail).toContain("const article = apiArticle");
    expect(detail).toContain("response?.views !== undefined");
    expect(detail).toContain("Number(response?.count)");
    expect(detail).toContain('typeof response?.isActive !== "boolean"');
    expect(detail).toContain("getImageUrl(path)");
    expect(detail).not.toContain("contextArticle");
    expect(detail).not.toContain("http://localhost:5000");
  });

  test("Article and Story details apply validated canonical, social, and robots metadata", () => {
    const metadata = read("src", "components", "shared", "DocumentMetadata.jsx");
    const article = read("src", "components", "ArticleDetail.js");
    const story = read("src", "stories", "StoryDetail.js");
    expect(metadata).toContain('["http:", "https:"]');
    expect(metadata).toContain('meta[property="og:title"]');
    expect(metadata).toContain('meta[name="robots"]');
    expect(metadata).toContain('link[rel="canonical"]');
    expect(article).toContain('<DocumentMetadata content={article} kind="Article" />');
    expect(story).toContain('<DocumentMetadata content={story} kind="Story" />');
  });

  test("Article CMS persists every SEO field and resolves local preview media through runtime configuration", () => {
    const context = read("src", "context", "ContentCmsContext.js");
    const cms = read("src", "components", "cms", "ArticleModule.js");
    expect(context).toContain("seo: article.seo || {}");
    expect(cms).toContain("canonicalUrl");
    expect(cms).toContain("openGraphImage");
    expect(cms).toContain("getImageUrl(articleDraft.coverImage, articleDraft.category)");
    expect(cms).not.toContain("http://localhost:5000");
  });
});
