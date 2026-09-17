"use strict";

const { phase5Catalog, CANONICAL_ARTICLE_CATEGORIES } = require("../data/phase5Articles");
const { EDITORIAL_BYLINE } = require("../config/constants");

describe("Phase 5 Step 2A Canonical Article Editorial Audit", () => {
  const lifeArticles = phase5Catalog.life;
  const reflectionsArticles = phase5Catalog.reflections;
  const allArticles = [...lifeArticles, ...reflectionsArticles];

  test("contains exactly 10 canonical articles in Batch 2A (5 Life, 5 Reflections)", () => {
    expect(lifeArticles).toHaveLength(5);
    expect(reflectionsArticles).toHaveLength(5);
    expect(allArticles).toHaveLength(10);
  });

  test("all slugs are unique, lowercase, and hyphenated", () => {
    const slugs = allArticles.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(10);

    slugs.forEach((slug) => {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).not.toMatch(/--/);
    });
  });

  test("all articles belong strictly to canonical Phase 5 categories", () => {
    lifeArticles.forEach((a) => {
      expect(a.category).toBe("Life");
      expect(CANONICAL_ARTICLE_CATEGORIES).toContain(a.category);
    });
    reflectionsArticles.forEach((a) => {
      expect(a.category).toBe("Reflections");
      expect(CANONICAL_ARTICLE_CATEGORIES).toContain(a.category);
    });
  });

  test("all articles have author/byline as MyJourney Editorial", () => {
    allArticles.forEach((a) => {
      expect(a.author).toBe(EDITORIAL_BYLINE);
      expect(a.byline).toBe(EDITORIAL_BYLINE);
    });
  });

  test("all articles have contentType: article, status: published, isArchived: false", () => {
    allArticles.forEach((a) => {
      expect(a.contentType).toBe("article");
      expect(a.status).toBe("published");
      expect(a.isArchived).toBe(false);
    });
  });

  test("no article contains Story-specific fields", () => {
    allArticles.forEach((a) => {
      expect(a.structuredSections).toBeUndefined();
      expect(a.layoutPreset).toBeUndefined();
      expect(a.cinematicTheme).toBeUndefined();
      expect(a.audioAtmosphere).toBeUndefined();
      expect(a.visualMotif).toBeUndefined();
    });
  });

  test("verifies word count standards: Pillars >= 9,000 and Longforms >= 6,000", () => {
    const pillars = [
      "the-architecture-of-living-together",
      "the-art-of-being-alone-without-becoming-lonely",
    ];

    allArticles.forEach((a) => {
      if (pillars.includes(a.slug)) {
        expect(a.wordCount).toBeGreaterThanOrEqual(9000);
        expect(a.wordCount).toBeLessThanOrEqual(12500);
      } else {
        expect(a.wordCount).toBeGreaterThanOrEqual(6000);
        expect(a.wordCount).toBeLessThanOrEqual(9500);
      }
    });
  });

  test("verifies reading time is calibrated (~200 wpm)", () => {
    allArticles.forEach((a) => {
      const expectedMinutes = Math.round(a.wordCount / 200);
      expect(a.readingTime).toBe(`${expectedMinutes} min read`);
    });
  });

  test("verifies media standards: 1 cover image + 2-4 inline images with alt and caption", () => {
    allArticles.forEach((a) => {
      expect(a.coverImage).toMatch(/^https?:\/\//);
      expect(a.coverImageAlt).toBeTruthy();
      expect(a.coverImageCaption).toBeTruthy();

      const inlineImages = (a.structuredBlocks || []).filter((b) => b.type === "image");
      expect(inlineImages.length).toBeGreaterThanOrEqual(2);
      expect(inlineImages.length).toBeLessThanOrEqual(4);

      inlineImages.forEach((img) => {
        expect(img.image).toMatch(/^https?:\/\//);
        expect(img.alt).toBeTruthy();
        expect(img.caption).toBeTruthy();
      });
    });
  });

  test("verifies rich block diversity (headings, paragraphs, callout, quote, list, table, dividers)", () => {
    allArticles.forEach((a) => {
      const blockTypes = new Set((a.structuredBlocks || []).map((b) => b.type));
      expect(blockTypes.has("heading")).toBe(true);
      expect(blockTypes.has("paragraph")).toBe(true);
      expect(blockTypes.has("callout")).toBe(true);
      expect(blockTypes.has("quote")).toBe(true);
      expect(blockTypes.has("image")).toBe(true);
      expect(blockTypes.has("list")).toBe(true);
      expect(blockTypes.has("table")).toBe(true);
      expect(blockTypes.has("divider")).toBe(true);
    });
  });

  test("verifies HTML body exists and matches structured blocks", () => {
    allArticles.forEach((a) => {
      expect(typeof a.body).toBe("string");
      expect(a.body.length).toBeGreaterThan(1000);
      expect(a.body).toContain("<h2");
      expect(a.body).toContain("<p");
      expect(a.body).toContain("<blockquote");
    });
  });

  test("verifies zero duplicate paragraphs within any article", () => {
    allArticles.forEach((a) => {
      const paragraphs = (a.structuredBlocks || [])
        .filter((b) => b.type === "paragraph")
        .map((b) => b.text.trim());
      const uniqueParagraphs = new Set(paragraphs);
      expect(uniqueParagraphs.size).toBe(paragraphs.length);
    });
  });

  test("verifies zero placeholder or lorem ipsum strings", () => {
    const bannedPatterns = [/lorem ipsum/i, /placeholder/i, /tbd/i, /coming soon/i, /todo/i];
    allArticles.forEach((a) => {
      const fullText = JSON.stringify(a);
      bannedPatterns.forEach((pattern) => {
        expect(fullText).not.toMatch(pattern);
      });
    });
  });

  test("verifies tags and references are properly populated", () => {
    allArticles.forEach((a) => {
      expect(Array.isArray(a.tags)).toBe(true);
      expect(a.tags.length).toBeGreaterThanOrEqual(4);

      expect(Array.isArray(a.references)).toBe(true);
      expect(a.references.length).toBeGreaterThanOrEqual(2);
      a.references.forEach((ref) => {
        expect(ref.title).toBeTruthy();
        expect(ref.url).toMatch(/^https?:\/\//);
      });
    });
  });
});
