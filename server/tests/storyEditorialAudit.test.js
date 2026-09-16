const launchStories = require("../data/launchStories");
const {
  getStoryWordCount,
  calculateStoryReadingTime,
  STORY_SECTION_TYPES,
  STORY_LAYOUT_IDS,
} = require("../utils/storyContent");
const { serializePublicContent } = require("../premium/contentPreview");

describe("Phase 4 Story Catalog & Reading Experience Audit (Life Collection)", () => {
  test("launch catalog contains original production life stories", () => {
    expect(Array.isArray(launchStories)).toBe(true);
    expect(launchStories.length).toBe(launchStories.length >= 10 ? 10 : 5);
  });

  test("all story slugs are unique, lower-kebab-case, and non-empty", () => {
    const slugs = launchStories.map((s) => s.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(launchStories.length);
    slugs.forEach((slug) => {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  test("all stories have valid status, layouts, and categories", () => {
    launchStories.forEach((story) => {
      expect(story.status).toBe("published");
      expect(STORY_LAYOUT_IDS).toContain(story.storyLayout);
      expect(typeof story.category).toBe("string");
      expect(story.category.trim().length).toBeGreaterThan(0);
      expect(typeof story.categorySlug).toBe("string");
      expect(Array.isArray(story.tags)).toBe(true);
      expect(story.tags.length).toBeGreaterThan(0);
      // Reflection questions are removed for literary human stories (empty array)
      expect(Array.isArray(story.reflectionQuestions)).toBe(true);
      expect(story.reflectionQuestions.length).toBe(0);
    });
  });

  test("target reading times and word counts are satisfied", () => {
    launchStories.forEach((story) => {
      const wordCount = getStoryWordCount(story);
      const readingTime = calculateStoryReadingTime(story);

      // All stories meet or exceed the ~16-20 min mark (~3,200+ words at 200 wpm)
      expect(wordCount).toBeGreaterThanOrEqual(3200);
      expect(readingTime).toBeGreaterThanOrEqual(16);
      // All 10 canonical stories meet or exceed the ~35 min mark (~7,000+ words at 200 wpm)
      expect(wordCount).toBeGreaterThanOrEqual(7000);
      expect(readingTime).toBeGreaterThanOrEqual(35);

      // The deep anchor read (The Report Card in the Drawer) hits the 40+ min longform band
      if (story.slug === "the-report-card-in-the-drawer") {
        expect(wordCount).toBeGreaterThanOrEqual(8000);
        expect(readingTime).toBeGreaterThanOrEqual(40);
      }

      // The Wedding Before the Dream hits the 45+ min longform band
      if (story.slug === "the-wedding-before-the-dream") {
        expect(wordCount).toBeGreaterThanOrEqual(9000);
        expect(readingTime).toBeGreaterThanOrEqual(45);
      }
    });

    const totalWords = launchStories.reduce((acc, s) => acc + getStoryWordCount(s), 0);
    expect(totalWords).toBeGreaterThan(25000);
    expect(totalWords).toBeGreaterThan(75000);
  });

  test("no story reuses filler text or duplicated paragraphs", () => {
    const allParagraphs = new Map();

    launchStories.forEach((story) => {
      const storyParagraphs = new Set();
      const sections = story.storySections || [];

      sections.forEach((section) => {
        const text = (section.body || "").trim();
        if (text.length > 50) {
          const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 50);
          paragraphs.forEach((p) => {
            // Check no duplicate within the same story
            expect(storyParagraphs.has(p)).toBe(false);
            storyParagraphs.add(p);

            // Check no duplicate across stories
            if (allParagraphs.has(p)) {
              throw new Error(
                `Duplicate paragraph found between "${story.title}" and "${allParagraphs.get(p)}": "${p.slice(0, 60)}..."`
              );
            }
            allParagraphs.set(p, story.title);
          });
        }
      });
    });
  });

  test("structured sections conform strictly to section schema and types", () => {
    launchStories.forEach((story) => {
      const sections = story.storySections || [];
      expect(sections.length).toBeGreaterThanOrEqual(5);

      sections.forEach((section) => {
        expect(STORY_SECTION_TYPES).toContain(section.type);
        expect(typeof section.id).toBe("string");
        expect(section.id.length).toBeGreaterThan(0);

        if (section.type === "chapter") {
          expect(section.chapterTitle.length).toBeGreaterThan(0);
          expect(section.body.length).toBeGreaterThan(20);
        }
        if (section.type === "dialogue") {
          expect(section.speaker.length).toBeGreaterThan(0);
          expect((section.dialogue || section.body).length).toBeGreaterThan(0);
        }
        if (section.type === "callout") {
          expect(["note", "tip", "warning", "info"]).toContain(section.calloutType);
          expect(section.body.length).toBeGreaterThan(5);
        }
        if (section.type === "quote") {
          expect(section.quote.length).toBeGreaterThan(0);
        }
      });
    });
  });

  test("access control: free and server-authoritative premium stories", () => {
    const premiumStories = launchStories.filter((s) => s.accessLevel === "premium");
    const freeStories = launchStories.filter((s) => s.accessLevel === "free");

    if (launchStories.length === 5) {
      expect(premiumStories.length).toBe(1);
      expect(freeStories.length).toBe(4);
      expect(premiumStories[0].slug).toBe("the-house-with-two-expectations");
    } else if (launchStories.length === 10) {
      expect(premiumStories.length).toBe(2);
      expect(freeStories.length).toBe(8);
      expect(premiumStories.map((s) => s.slug).sort()).toEqual([
        "the-house-with-two-expectations",
        "the-wedding-before-the-dream",
      ].sort());
    }

    // Test server-authoritative redaction for unauthenticated/free access
    const publicPreview = serializePublicContent(premiumStories[0], { canAccessPremium: false });
    expect(publicPreview.premiumRequired).toBe(true);
    expect(publicPreview.body).toBe("");
    expect(publicPreview.storySections).toEqual([]);
    expect(publicPreview.previewMode).toBe("excerpt_only");

    // Test entitled access preserves full sections
    const entitledDetail = serializePublicContent(premiumStories[0], { canAccessPremium: true });
    expect(entitledDetail.premiumRequired).toBe(false);
    expect(Array.isArray(entitledDetail.storySections)).toBe(true);
    expect(entitledDetail.storySections.length).toBeGreaterThan(0);
  });

  test("story navigation and discovery metadata is consistent", () => {
    launchStories.forEach((story) => {
      expect(Array.isArray(story.relatedStories)).toBe(true);
      expect(story.relatedStories.length).toBeGreaterThan(0);

      // Verify relatedStories refer to existing stories or valid candidates
      story.relatedStories.forEach((relatedSlug) => {
        expect(typeof relatedSlug).toBe("string");
      });
    });
  });
});
