const fs = require("fs");
const path = require("path");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

describe("core interaction reliability client contracts", () => {
  test("Article active states are declared after experience-specific important defaults", () => {
    const css = read("index.css");
    const experienceDefault = css.lastIndexOf('.premium-article-hero .premium-stats-bar .stat-btn');
    const activeContract = css.lastIndexOf(
      '.article-detail-theme .premium-stats-bar .stat-btn.active.like-btn {'
    );

    expect(experienceDefault).toBeGreaterThan(-1);
    expect(activeContract).toBeGreaterThan(experienceDefault);
    expect(css.slice(activeContract)).toContain("color: #ff4d4f !important");
    expect(css.slice(activeContract)).toContain("color: var(--gold, #b58b5f) !important");
    expect(css.slice(activeContract)).toContain("color: var(--teal, #426c67) !important");
    expect(css.slice(activeContract)).toContain(".stat-btn:focus-visible");
  });

  test("Reader mutations are rejected after the authenticated identity changes", () => {
    const context = read("src", "context", "ReaderContext.js");
    const detail = read("src", "components", "ArticleDetail.js");

    expect(context).toContain("activeUserIdRef.current !== mutationUserId");
    expect(context).toContain("return false");
    expect(context).toContain("ownsReaderData");
    expect(detail).toContain("userId: user?.id");
    expect(detail).toContain('code: "READER_SESSION_CHANGED"');
  });

  test("global providers do not request Admin media or private Agent conversations anonymously", () => {
    const media = read("src", "context", "MediaCmsContext.js");
    const agent = read("src", "features", "agent", "AgentContext.jsx");

    expect(media).toContain('const isAdmin = isAuthenticated && user?.role === "Admin"');
    expect(media).toContain('window.localStorage.removeItem(STORAGE_KEY)');
    expect(media).toContain('setSyncStatus("idle")');
    expect(agent).toContain("const requests = user");
    expect(agent).toContain("[agentApi.capabilities()]");
  });

  test("progress cleanup observes the current auth-enabled state", () => {
    const progress = read("src", "hooks", "useArticleReadingProgress.js");
    expect(progress).toContain("enabledRef.current = enabled");
    expect(progress).toContain("if (!enabledRef.current || !articleId) return");
  });

  test("Playwright uses deterministic fixtures in an isolated test database", () => {
    const config = read("playwright.config.js");
    const environment = read("e2e", "support", "environment.cjs");
    const setup = read("e2e", "support", "global-setup.cjs");
    const smoke = read("e2e", "core-interactions.spec.js");

    expect(config).toContain('globalSetup: require.resolve("./e2e/support/global-setup.cjs")');
    expect(environment).toContain("myjourney_e2e");
    expect(environment).toContain("ending in _e2e or _test");
    expect(setup).toContain("ReaderProfile.findOneAndUpdate");
    expect(smoke).toContain('name: "Unlike article"');
    expect(smoke).toContain('name: "Remove article bookmark"');
    expect(smoke).toContain('name: "Remove article from saved articles"');
  });
});
