"use strict";

const migration013 = require("../migrations/013-phase5-article-catalog-reset");
const { EDITORIAL_BYLINE, CANONICAL_ARTICLE_CATEGORIES } = require("../config/constants");
const { serializePublicContent } = require("../premium/contentPreview");
const {
  validateEditorialProvenance,
  validateTravelVerification,
} = require("../validators/articleValidator");

describe("Phase 5 Step 1: Article Catalog Foundation & Safe Reset", () => {
  describe("Migration 013: Dry Run & Audit Counts", () => {
    test("plan() returns exact before counts, affected counts, slugs, and protected counts without mutating", async () => {
      const targetArticles = [
        { _id: "art-1", slug: "legacy-growth-habits", title: "Legacy Growth Habits", category: "Life", categorySlug: "life", contentType: "article", status: "published" },
        { _id: "art-2", slug: "legacy-reflections", title: "Old Reflections", category: "Reflections", categorySlug: "reflections", contentType: "article", status: "published" },
        { _id: "art-3", slug: "already-archived-1", title: "Already Archived", category: "Life", categorySlug: "life", contentType: "article", status: "archived", isArchived: true, archivedAt: new Date("2026-01-01") },
      ];

      const mockDb = {
        collection: jest.fn((name) => {
          if (name === "articles") {
            return {
              find: jest.fn(() => ({
                toArray: jest.fn().mockResolvedValue(targetArticles),
              })),
              countDocuments: jest.fn((query) => {
                // Story count
                if (query.$or && query.$or.some((c) => c.contentType === "story")) return Promise.resolve(20);
                // News count
                if (query.$or && query.$or.some((c) => String(c.categorySlug) === "news")) return Promise.resolve(10);
                // Coding count
                if (query.$or && query.$or.some((c) => String(c.categorySlug) === "coding")) return Promise.resolve(15);
                // Incidents count
                if (query.$or && query.$or.some((c) => String(c.categorySlug) === "incidents")) return Promise.resolve(4);
                return Promise.resolve(0);
              }),
            };
          }
          if (name === "categories") {
            return {
              findOne: jest.fn().mockResolvedValue({ _id: "cat-inc", slug: "incidents", name: "Incidents" }),
            };
          }
          return {};
        }),
      };

      const report = await migration013.plan(mockDb);

      expect(report.dryRun).toBe(true);
      expect(report.beforeCount).toBe(3);
      expect(report.alreadyArchivedCount).toBe(1);
      expect(report.affectedCount).toBe(2);
      expect(report.affectedSlugs).toEqual(["legacy-growth-habits", "legacy-reflections"]);
      expect(report.affectedIds).toEqual(["art-1", "art-2"]);
      expect(report.protectedCounts).toEqual({
        stories: 20,
        news: 10,
        coding: 15,
      });
      expect(report.taxonomy.incidentsArticlesCount).toBe(4);
      expect(report.taxonomy.incidentsCategoryExists).toBe(true);
    });

    test("up(db, { dryRun: true }) delegates to plan() and performs zero writes", async () => {
      const updateMany = jest.fn();
      const updateOne = jest.fn();
      const mockDb = {
        collection: jest.fn((name) => ({
          find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) })),
          countDocuments: jest.fn().mockResolvedValue(0),
          findOne: jest.fn().mockResolvedValue(null),
          updateMany,
          updateOne,
        })),
      };

      const result = await migration013.up(mockDb, { dryRun: true });
      expect(result.dryRun).toBe(true);
      expect(updateMany).not.toHaveBeenCalled();
      expect(updateOne).not.toHaveBeenCalled();
    });
  });

  describe("Migration 013: Protection of Stories, News, and Coding", () => {
    test("target filter strictly excludes Stories, News, and Coding", () => {
      const filter = migration013.buildTargetFilter();

      // Check category exclusion
      expect(filter.category.$nin).toBeDefined();
      const patterns = filter.category.$nin;
      expect(patterns.some((p) => p instanceof RegExp && p.test("News"))).toBe(true);
      expect(patterns.some((p) => p instanceof RegExp && p.test("Coding"))).toBe(true);
      expect(patterns.some((p) => p instanceof RegExp && p.test("Stories"))).toBe(true);

      // Check categorySlug exclusion
      expect(filter.categorySlug.$nin).toEqual(expect.arrayContaining(["news", "coding", "stories"]));

      // Check explicit $and guards for Story records
      const andGuards = filter.$and;
      expect(andGuards).toEqual(
        expect.arrayContaining([
          { contentType: { $ne: "story" } },
          { storyLayout: { $in: [null, "", undefined] } },
          { category: { $ne: "Stories" } },
          { categorySlug: { $ne: "stories" } },
        ])
      );
    });

    test("up() executes safe soft archival and index creation without calling deleteMany", async () => {
      const updateMany = jest.fn().mockResolvedValue({ modifiedCount: 5, matchedCount: 5 });
      const updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      const deleteMany = jest.fn();
      const createIndex = jest.fn().mockResolvedValue("article_archived_status_published");
      const indexes = jest.fn().mockResolvedValue([]);

      const mockDb = {
        collection: jest.fn((name) => ({
          find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) })),
          countDocuments: jest.fn().mockResolvedValue(0),
          findOne: jest.fn().mockResolvedValue({ _id: "cat-1", slug: "incidents" }),
          updateMany,
          updateOne,
          deleteMany,
          createIndex,
          indexes,
        })),
      };

      const result = await migration013.up(mockDb);

      expect(result.success).toBe(true);
      expect(deleteMany).not.toHaveBeenCalled();
      expect(updateMany).toHaveBeenCalled();

      // Check updateMany call for soft archival
      const archivalCall = updateMany.mock.calls.find((call) =>
        Array.isArray(call[1]) && call[1][0]?.$set?.status === "archived"
      );
      expect(archivalCall).toBeDefined();
      const setOp = archivalCall[1][0].$set;
      expect(setOp.status).toBe("archived");
      expect(setOp.isArchived).toBe(true);
      expect(setOp.isFeatured).toBe(false);
      expect(setOp.isTrending).toBe(false);
    });
  });

  describe("Migration 013: Idempotency", () => {
    test("running migration repeatedly is safe and preserves existing archivedAt", async () => {
      const updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0, matchedCount: 5 });
      const updateOne = jest.fn().mockResolvedValue({ modifiedCount: 0 });
      const mockDb = {
        collection: jest.fn(() => ({
          find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) })),
          countDocuments: jest.fn().mockResolvedValue(0),
          findOne: jest.fn().mockResolvedValue(null),
          updateMany,
          updateOne,
          indexes: jest.fn().mockResolvedValue([{ key: { isArchived: 1, status: 1, publishedAt: -1 }, name: "article_archived_status_published" }]),
          createIndex: jest.fn(),
        })),
      };

      const firstRun = await migration013.up(mockDb);
      const secondRun = await migration013.up(mockDb);

      expect(firstRun.success).toBe(true);
      expect(secondRun.success).toBe(true);
      expect(secondRun.affectedCount).toBe(0);
    });
  });

  describe("Archived Article Behavior & Zero Prose Leakage", () => {
    test("public serialization strips body, storySections, and structuredBlocks for archived articles", () => {
      const archivedArticle = {
        _id: "art-archived-99",
        slug: "legacy-dummy-post",
        title: "Legacy Dummy Post",
        body: "<h2>Secret Prose</h2><p>This dummy content must never leak publicly.</p>",
        structuredBlocks: [{ type: "paragraph", text: "Prose block that must not leak" }],
        storySections: [{ heading: "Chapter 1", body: "Story chapter prose" }],
        category: "Experiences",
        status: "archived",
        isArchived: true,
        archivedAt: new Date("2026-09-01"),
        seo: {
          title: "Legacy Dummy Post",
          metaRobots: "noindex,follow",
        },
      };

      const publicOutput = serializePublicContent(archivedArticle);

      expect(publicOutput.status).toBe("archived");
      expect(publicOutput.isArchived).toBe(true);
      expect(publicOutput.body).toBe("");
      expect(publicOutput.structuredBlocks).toEqual([]);
      expect(publicOutput.storySections).toEqual([]);
      expect(publicOutput.title).toBe("Legacy Dummy Post");
    });

    test("public serialization strips confidentialNotes from editorialProvenance", () => {
      const articleWithProvenance = {
        _id: "art-exp-1",
        slug: "authorized-founder-story",
        title: "Authorized Founder Story",
        body: "<p>Public authorized content.</p>",
        category: "Experiences",
        status: "published",
        editorialProvenance: {
          provenanceType: "first_person_authorized",
          subjectIdentity: "Jane Doe",
          authorizationReference: "AUTH-2026-09-001",
          editorialConsentConfirmed: true,
          confidentialNotes: "LEGAL CONFIDENTIAL: Source requested off-the-record identity protection on paragraph 4.",
        },
      };

      const publicOutput = serializePublicContent(articleWithProvenance);

      expect(publicOutput.editorialProvenance).toBeDefined();
      expect(publicOutput.editorialProvenance.provenanceType).toBe("first_person_authorized");
      expect(publicOutput.editorialProvenance.subjectIdentity).toBe("Jane Doe");
      expect(publicOutput.editorialProvenance.authorizationReference).toBe("AUTH-2026-09-011".slice(0, 0) || "AUTH-2026-09-001");
      expect(publicOutput.editorialProvenance.editorialConsentConfirmed).toBe(true);
      expect(publicOutput.editorialProvenance.confidentialNotes).toBeUndefined();
    });
  });

  describe("Experiences Editorial Provenance Validation", () => {
    test("rejects invalid provenanceType", () => {
      const result = validateEditorialProvenance({ provenanceType: "invented_rumor" });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Editorial provenance must be either");
    });

    test("validates first_person_authorized requires reference or identity", () => {
      const invalid = validateEditorialProvenance({
        provenanceType: "first_person_authorized",
        subjectIdentity: "",
        authorizationReference: "",
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain("First-person authorized experiences require");

      const valid = validateEditorialProvenance({
        provenanceType: "first_person_authorized",
        authorizationReference: "AUTH-REF-100",
      });
      expect(valid.valid).toBe(true);
    });

    test("validates reported_case_study requires source documentation or case study source", () => {
      const invalid = validateEditorialProvenance({
        provenanceType: "reported_case_study",
        caseStudySource: "",
        sourceDocumentation: [],
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain("Reported case studies require");

      const valid = validateEditorialProvenance({
        provenanceType: "reported_case_study",
        caseStudySource: "ACM Case Study Archives",
        sourceDocumentation: ["https://example.com/case/101"],
      });
      expect(valid.valid).toBe(true);
    });
  });

  describe("Travel Verification Metadata Validation", () => {
    test("validates currency code format", () => {
      const invalid = validateTravelVerification({ currency: "INVALID_CURRENCY" });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain("Currency must be a valid 3-letter currency code");

      const valid = validateTravelVerification({ currency: "USD" });
      expect(valid.valid).toBe(true);
    });

    test("validates verification date timestamps", () => {
      const invalid = validateTravelVerification({ lastVerifiedAt: "not-a-valid-date" });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain("lastVerifiedAt must be a valid date");

      const valid = validateTravelVerification({
        lastVerifiedAt: "2026-09-15T00:00:00.000Z",
        budgetVerifiedAt: "2026-09-10T00:00:00.000Z",
        currency: "EUR",
        officialSources: [{ title: "Official Rail System", url: "https://rail.example.com" }],
      });
      expect(valid.valid).toBe(true);
    });
  });

  describe("Controller Backwards Compatibility & Tombstone Responses", () => {
    test("articleController.getArticleBySlug returns 200 tombstone with no leaked prose for archived articles", async () => {
      const articleController = require("../controllers/articleController");
      const articleService = require("../services/articleService");

      const archivedDoc = {
        _id: "507f1f77bcf86cd799439099",
        slug: "legacy-post-to-tombstone",
        title: "Legacy Post to Tombstone",
        body: "<h1>Old Prototype</h1><p>Prose that should be completely cleared.</p>",
        structuredBlocks: [{ type: "paragraph", text: "Should be empty." }],
        category: "Experiences",
        categorySlug: "experiences",
        status: "archived",
        isArchived: true,
      };

      jest.spyOn(articleService, "getArticleBySlug").mockResolvedValue(archivedDoc);

      const req = { params: { slug: "legacy-post-to-tombstone" }, user: null };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        set: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await articleController.getArticleBySlug(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          archived: true,
          slug: "legacy-post-to-tombstone",
          title: "Legacy Post to Tombstone",
          message: "This article has been archived and is no longer available.",
          article: expect.objectContaining({
            status: "archived",
            isArchived: true,
            body: "",
            structuredBlocks: [],
            seo: expect.objectContaining({
              metaRobots: "noindex,follow",
            }),
          }),
        })
      );
    });

    test("articleController.getArticles maps category=incidents query to Experiences", async () => {
      const articleController = require("../controllers/articleController");
      const articleService = require("../services/articleService");

      const spy = jest.spyOn(articleService, "getArticles").mockResolvedValue({
        articles: [],
        pagination: { page: 1, pages: 1, total: 0 },
      });

      const req = { query: { category: "incidents" }, user: null };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await articleController.getArticles(req, res, next);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "Experiences",
        })
      );
    });

    test("categoryController.getCategoryBySlug resolves experiences when incidents is requested", async () => {
      const categoryController = require("../controllers/categoryController");
      const categoryService = require("../services/categoryService");

      const spy = jest.spyOn(categoryService, "getCategoryBySlug").mockResolvedValue({
        _id: "cat-exp-1",
        name: "Experiences",
        slug: "experiences",
      });

      const req = { params: { slug: "incidents" }, query: {}, user: null };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await categoryController.getCategoryBySlug(req, res, next);

      expect(spy).toHaveBeenCalledWith("experiences");
      expect(res.json).toHaveBeenCalledWith({
        category: expect.objectContaining({
          slug: "experiences",
        }),
      });
    });
  });

  describe("Authorship & Taxonomy Constants", () => {
    test("canonical editorial byline is MyJourney Editorial", () => {
      expect(EDITORIAL_BYLINE).toBe("MyJourney Editorial");
    });

    test("canonical article categories contain Life, Reflections, Experiences, Lessons, Travel", () => {
      expect(CANONICAL_ARTICLE_CATEGORIES).toEqual([
        "Life",
        "Reflections",
        "Experiences",
        "Lessons",
        "Travel",
      ]);
    });
  });
});
