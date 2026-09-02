const { serializePublicContent } = require("../premium/contentPreview");

const freeArticle = { title: "Free Article", slug: "free-article", body: "FREE FULL BODY", accessLevel: "free", contentType: "article" };
const premiumArticle = { title: "Premium Article", slug: "premium-article", description: "Public description", excerpt: "Public excerpt", body: "PREMIUM ARTICLE SECRET BODY", accessLevel: "premium", contentType: "article" };
const premiumStory = { title: "Premium Story", slug: "premium-story", description: "Public premise", body: "PREMIUM STORY SECRET BODY", storySections: [{ heading: "Secret", body: "SECRET CHAPTER" }], storyLayout: "chapter-journey", accessLevel: "premium", contentType: "story" };

describe("Premium Article and Story API representation", () => {
  test.each([
    ["anonymous", false],
    ["Free account", false],
    ["Premium account", true],
  ])("Free Article is complete for %s", (_viewer, canAccessPremium) => {
    expect(serializePublicContent(freeArticle, { canAccessPremium }).body).toBe("FREE FULL BODY");
  });

  test.each([
    ["anonymous", false, true],
    ["Free account", false, true],
    ["Premium account", true, false],
  ])("Premium Article response for %s follows the protected matrix", (_viewer, canAccessPremium, preview) => {
    const result = serializePublicContent(premiumArticle, { canAccessPremium });
    expect(result.premiumRequired).toBe(preview);
    expect(JSON.stringify(result).includes("PREMIUM ARTICLE SECRET BODY")).toBe(!preview);
    if (preview) expect(result.body).toBe("");
  });

  test.each([
    ["anonymous", false, true],
    ["Free account", false, true],
    ["Premium account", true, false],
  ])("Premium Story response for %s follows the protected matrix", (_viewer, canAccessPremium, preview) => {
    const result = serializePublicContent(premiumStory, { canAccessPremium });
    expect(result.storyLayout).toBe("chapter-journey");
    expect(result.premiumRequired).toBe(preview);
    expect(JSON.stringify(result).includes("PREMIUM STORY SECRET BODY")).toBe(!preview);
    expect(JSON.stringify(result).includes("SECRET CHAPTER")).toBe(!preview);
    if (preview) expect(result.storySections).toEqual([]);
  });

  test("legacy content without accessLevel remains Free", () => {
    const result = serializePublicContent({ title: "Legacy", body: "LEGACY BODY" }, {});
    expect(result.accessLevel).toBe("free");
    expect(result.body).toBe("LEGACY BODY");
  });

  test("public listings never include a Premium body even for an authenticated subscriber", () => {
    const result = serializePublicContent(premiumArticle, { canAccessPremium: true, listing: true });
    expect(result.body).toBe("");
    expect(result.premiumRequired).toBe(true);
  });

  test("public listings omit Free bodies and internal ownership fields", () => {
    const result = serializePublicContent({
      ...freeArticle,
      createdBy: "admin-id",
      creatorWorkflowStatus: "approved",
    }, { listing: true });
    expect(result.body).toBeUndefined();
    expect(result.createdBy).toBeUndefined();
    expect(result.creatorWorkflowStatus).toBeUndefined();
  });

  test("public details sanitize legacy stored HTML before rendering", () => {
    const result = serializePublicContent({
      ...freeArticle,
      body: '<p style="position:fixed">Safe</p><script>alert(1)</script>',
      storySections: [{ body: '<iframe src="https://attacker.example"></iframe><strong>Chapter</strong>' }],
    });
    expect(result.body).toBe('<p>Safe</p>');
    expect(result.storySections[0].body).toBe('<strong>Chapter</strong>');
  });
});
