const fs = require("fs");
const path = require("path");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

describe("Premium frontend and CMS contracts", () => {
  test("one shared authenticated entitlement state feeds Premium consumers", () => {
    const auth = read("src", "context", "AuthContext.js");
    expect(auth).toContain("accountAccess");
    expect(auth).toContain("membershipApi.me()");
    expect(auth).toContain("hasEntitlement");
    expect(auth).not.toContain("localStorage.setItem(\"premium\"");
  });

  test("Premium page exposes four duration choices without tiers, prices, or fake success", () => {
    const page = read("src", "features", "premium", "PremiumPage.jsx");
    expect(page).toContain('displayLabel: "1 Month"');
    expect(page).toContain('displayLabel: "3 Months"');
    expect(page).toContain('displayLabel: "6 Months"');
    expect(page).toContain('displayLabel: "1 Year"');
    expect(page).toContain("Same Premium access. Choose how long.");
    expect(page).toContain("Billing is not configured yet");
    expect(page).not.toMatch(/Save \d+%|limited slots|countdown|Upgrade to Pro/i);
  });

  test("Article and Story previews use the same membership boundary and Story fallback cannot bypass the API", () => {
    const article = read("src", "components", "ArticleDetail.js");
    const story = read("src", "stories", "StoryDetail.js");
    expect(article).toContain("article.premiumRequired");
    expect(story).toContain("story.premiumRequired");
    expect(story).not.toContain("cmsSeed");
    expect(story).not.toContain("getFallbackBySlug");
  });

  test("Article and Story CMS expose only generic Free/Premium access", () => {
    const articleCms = read("src", "components", "cms", "ArticleModule.js");
    const storyCms = read("src", "components", "cms", "panels", "StoryCmsPanel.js");
    [articleCms, storyCms].forEach((source) => {
      expect(source).toContain('<option value="free">Free</option>');
      expect(source).toContain('<option value="premium">Premium</option>');
      expect(source).not.toMatch(/Life Pro|Story Premium plan|Article Premium plan/);
    });
  });

  test("Life uses the global life_access entitlement and preserves privacy routes", () => {
    const app = read("src", "App.js");
    const gate = read("src", "features", "premium", "LifePremiumGate.jsx");
    const server = read("server", "index.js");
    expect(app).toContain("<LifePremiumGate>");
    expect(gate).toContain('hasEntitlement("life_access")');
    expect(server).toContain("requireEntitlement(ENTITLEMENTS.LIFE_ACCESS)");
    expect(server).toContain('/settings/export');
    expect(server).toContain('/settings/data');
  });

  test("responsive Premium CSS uses compact mobile durations and accessible interaction states", () => {
    const page = read("src", "features", "premium", "PremiumPage.jsx");
    const css = read("src", "features", "premium", "premium.css");
    expect(page).toContain('role="radiogroup"');
    expect(page).toContain('"ArrowRight"');
    expect(page).toContain("tabIndex=");
    expect(css).toContain("@media (max-width: 820px)");
    expect(css).toContain("@media (max-width: 430px)");
    expect(css).toMatch(/\.premium-duration-grid button\s*\{[\s\S]*?min-height:/);
    expect(css).not.toMatch(/grid-template-columns:\s*repeat\(3/);
    expect(css).toContain("prefers-reduced-motion");
  });
});
