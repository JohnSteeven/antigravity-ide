const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseLesson = require("../models/CourseLesson");
const Article = require("../models/Article");
const GameContentPack = require("../models/GameContentPack");
const { COURSE_MONETIZATION_TYPES, LESSON_TYPES } = require("../learn/constants");
const settingController = require("../controllers/settingController");
const articleController = require("../controllers/articleController");
const storyController = require("../controllers/storyController");

describe("Phase 3 CMS + Content Architecture Upgrade", () => {
  describe("1. Course Commerce Architecture & Monetization", () => {
    test("defines authoritative monetization types FREE, PREMIUM_INCLUDED, STANDALONE_PAID", () => {
      expect(COURSE_MONETIZATION_TYPES).toEqual(["FREE", "PREMIUM_INCLUDED", "STANDALONE_PAID"]);
      expect(LESSON_TYPES).toContain("coding");
      expect(LESSON_TYPES).toContain("quiz");
      expect(LESSON_TYPES).toContain("project");
    });

    test("Course model defaults monetizationType to FREE and validates allowed values", () => {
      const course = new Course({
        title: "Architecture Masterclass",
        slug: "architecture-masterclass",
        description: "A comprehensive course on software architecture.",
        creatorId: new mongoose.Types.ObjectId(),
        language: "en",
        rightsConfirmedAt: new Date(),
      });

      expect(course.monetizationType).toBe("FREE");
      expect(course.accessLevel).toBe("free");

      course.monetizationType = "STANDALONE_PAID";
      const errValid = course.validateSync();
      expect(errValid).toBeUndefined();

      course.monetizationType = "INVALID_TIER";
      const errInvalid = course.validateSync();
      expect(errInvalid.errors.monetizationType).toBeDefined();
    });

    test("Course model includes justified compound indexes", () => {
      const indexes = Course.schema.indexes();
      const hasMonetizationIndex = indexes.some(([fields]) =>
        fields.publicationStatus === 1 && fields.monetizationType === 1 && fields.publishedAt === -1
      );
      expect(hasMonetizationIndex).toBe(true);

      // Verify no speculative indexes exist on array or duration fields
      const hasPrereqIndex = indexes.some(([fields]) => fields.prerequisites !== undefined);
      const hasOutcomesIndex = indexes.some(([fields]) => fields.learningOutcomes !== undefined);
      const hasDurationIndex = indexes.some(([fields]) => fields.estimatedDurationMinutes !== undefined);
      expect(hasPrereqIndex).toBe(false);
      expect(hasOutcomesIndex).toBe(false);
      expect(hasDurationIndex).toBe(false);
    });
  });

  describe("2. Coding Lesson Block & Quiz Question Protection", () => {
    test("CourseLesson model protects solutionCode and tests assertions with select: false", () => {
      const codingBlockPath = CourseLesson.schema.path("codingBlocks");
      expect(codingBlockPath).toBeDefined();

      const codingSchema = codingBlockPath.schema;
      expect(codingSchema.path("solutionCode").options.select).toBe(false);
      expect(codingSchema.path("tests").options.select).toBe(false);

      // Public fields must NOT be select: false
      expect(codingSchema.path("title").options.select).toBeUndefined();
      expect(codingSchema.path("content").options.select).toBeUndefined();
      expect(codingSchema.path("starterCode").options.select).toBeUndefined();
      expect(codingSchema.path("instructions").options.select).toBeUndefined();
      expect(codingSchema.path("expectedOutput").options.select).toBeUndefined();
      expect(codingSchema.path("hints").options.select).toBeUndefined();
    });

    test("CourseLesson model protects quiz correctOptionIndex and enforces 2-6 options", () => {
      const quizQuestionsPath = CourseLesson.schema.path("quizQuestions");
      expect(quizQuestionsPath).toBeDefined();

      const quizSchema = quizQuestionsPath.schema;
      expect(quizSchema.path("correctOptionIndex").options.select).toBe(false);
      expect(quizSchema.path("question").options.select).toBeUndefined();
      expect(quizSchema.path("explanation").options.select).toBeUndefined();

      // Test validation of options count (min 2, max 6)
      const lesson = new CourseLesson({
        courseId: new mongoose.Types.ObjectId(),
        moduleId: new mongoose.Types.ObjectId(),
        creatorId: new mongoose.Types.ObjectId(),
        lessonType: "quiz",
        title: "Quiz Lesson",
        slug: "quiz-lesson",
        order: 1,
        quizQuestions: [
          {
            question: "Only one option?",
            options: [{ text: "Option A" }],
            correctOptionIndex: 0,
          },
        ],
      });

      const errOne = lesson.validateSync();
      expect(errOne.errors["quizQuestions.0.options"]).toBeDefined();

      lesson.quizQuestions[0].options = [
        { text: "Option A" },
        { text: "Option B" },
      ];
      const errTwo = lesson.validateSync();
      expect(errTwo).toBeUndefined();
    });
  });

  describe("3. Structured Article Blocks & Editorial Review Status", () => {
    test("Article model supports status review alongside draft, published, archived", () => {
      const article = new Article({
        title: "Test Editorial Article",
        slug: "test-editorial-article",
        category: "Life",
        status: "review",
      });
      const err = article.validateSync();
      expect(err).toBeUndefined();
      expect(article.status).toBe("review");
    });

    test("Article model supports allowlisted structured blocks", () => {
      const article = new Article({
        title: "Block Article",
        slug: "block-article",
        category: "Tech",
        structuredBlocks: [
          { type: "paragraph", content: "Paragraph text" },
          { type: "heading", content: "Section Heading", level: 2 },
          { type: "quote", quote: "Wisdom quote", author: "Thinker" },
          { type: "callout", content: "Important reminder", calloutType: "warning" },
          { type: "code", code: "const x = 10;", language: "javascript" },
          { type: "divider" },
        ],
        references: [{ title: "Spec Doc", url: "https://example.com/spec" }],
        sources: ["https://example.com/src"],
      });

      const err = article.validateSync();
      expect(err).toBeUndefined();
      expect(article.structuredBlocks).toHaveLength(6);
      expect(article.references).toHaveLength(1);
    });

    test("Article model rejects unallowlisted block types", () => {
      const article = new Article({
        title: "Invalid Block Article",
        slug: "invalid-block-article",
        category: "Tech",
        structuredBlocks: [
          { type: "arbitrary_custom_widget", content: "malicious" },
        ],
      });

      const err = article.validateSync();
      expect(err.errors["structuredBlocks.0.type"]).toBeDefined();
    });
  });

  describe("4. Play Content Management (GameContentPack)", () => {
    test("GameContentPack model enforces gameKey, unique key, and 2-6 options per question", () => {
      const pack = new GameContentPack({
        key: "challenge-pack-1",
        gameKey: "who-knows-me-better",
        title: "Friendship Edition",
        questions: [
          {
            prompt: "What is my favorite season?",
            options: ["Spring", "Summer", "Autumn", "Winter"],
            correctAnswer: "Autumn",
          },
        ],
      });

      const err = pack.validateSync();
      expect(err).toBeUndefined();
      expect(pack.status).toBe("draft");
      expect(pack.difficulty).toBe("mixed");

      // Verify correctAnswer is select: false
      const questionSchema = GameContentPack.schema.path("questions").schema;
      expect(questionSchema.path("correctAnswer").options.select).toBe(false);

      // Verify invalid gameKey
      pack.gameKey = "unsupported-game";
      const errGame = pack.validateSync();
      expect(errGame.errors.gameKey).toBeDefined();
    });

    test("GameContentPack index covers gameKey, locale, status, isDeleted", () => {
      const indexes = GameContentPack.schema.indexes();
      const hasLookupIndex = indexes.some(([fields]) =>
        fields.gameKey === 1 && fields.locale === 1 && fields.status === 1 && fields.isDeleted === 1
      );
      expect(hasLookupIndex).toBe(true);
    });
  });

  describe("5. Discovery & Homepage Server Validation", () => {
    test("public settings endpoint allows only approved public keys", async () => {
      const settingService = require("../services/settingService");
      const origGet = settingService.getSettingByKey;
      settingService.getSettingByKey = jest.fn().mockResolvedValue({ hero: { title: "Welcome" } });

      try {
        const reqSafe = { params: { key: "homepage" } };
        let resSafeJson = null;
        const resSafe = { json: (data) => { resSafeJson = data; } };
        await settingController.getPublicSetting(reqSafe, resSafe, () => {});
        expect(resSafeJson).toMatchObject({ success: true, key: "homepage", value: { hero: { title: "Welcome" } } });

        const reqDisallowed = { params: { key: "smtp" } };
        let disallowedStatus = null;
        let disallowedJson = null;
        const resDisallowed = {
          status: (code) => {
            disallowedStatus = code;
            return { json: (d) => { disallowedJson = d; } };
          },
        };
        await settingController.getPublicSetting(reqDisallowed, resDisallowed, () => {});
        expect(disallowedStatus).toBe(404);
        expect(disallowedJson.message).toMatch(/access denied/i);
      } finally {
        settingService.getSettingByKey = origGet;
      }
    });

    test("homepage setting update strictly rejects private Life data", async () => {
      const reqWithLife = {
        params: { key: "homepage" },
        body: {
          value: {
            hero: { title: "Welcome" },
            lifeEntries: [{ title: "My Private Journal" }],
          },
        },
        user: { _id: new mongoose.Types.ObjectId() },
      };

      let statusCode = null;
      let responseBody = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { responseBody = data; } };
        },
      };

      await settingController.updateSetting(reqWithLife, res, () => {});
      expect(statusCode).toBe(400);
      expect(responseBody.message).toMatch(/private life data cannot be placed/i);
    });

    test("projects setting update validates array structure", async () => {
      const reqInvalid = {
        params: { key: "projects" },
        body: { value: "not-an-array" },
        user: { _id: new mongoose.Types.ObjectId() },
      };

      let statusCode = null;
      let responseBody = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { responseBody = data; } };
        },
      };

      await settingController.updateSetting(reqInvalid, res, () => {});
      expect(statusCode).toBe(422);
      expect(responseBody.message).toMatch(/must be an array/i);
    });
  });

  describe("6. Slug Uniqueness & E11000 Conflict Handling", () => {
    test("storyController catches MongoDB E11000 and responds with 409 Conflict", async () => {
      const duplicateError = new Error("E11000 duplicate key error collection: myjourney.articles index: slug_1 dup key");
      duplicateError.code = 11000;

      const req = {
        body: {
          title: "Duplicate Story",
          slug: "duplicate-story",
          contentType: "story",
        },
        user: { _id: new mongoose.Types.ObjectId() },
      };

      let statusCode = null;
      let responseBody = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { responseBody = data; } };
        },
      };

      const articleService = require("../services/articleService");
      const origCreate = articleService.createArticle;
      articleService.createArticle = jest.fn().mockRejectedValue(duplicateError);

      try {
        await storyController.createStory(req, res, () => {});
        expect(statusCode).toBe(409);
        expect(responseBody.message).toMatch(/already exists/i);
      } finally {
        articleService.createArticle = origCreate;
      }
    });

    test("articleController catches MongoDB E11000 and responds with 409 Conflict", async () => {
      const duplicateError = new Error("E11000 duplicate key error collection: myjourney.articles index: slug_1 dup key");
      duplicateError.code = 11000;

      const req = {
        body: {
          title: "Duplicate Article",
          slug: "duplicate-article",
        },
        user: { _id: new mongoose.Types.ObjectId() },
      };

      let statusCode = null;
      let responseBody = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { responseBody = data; } };
        },
      };

      const articleService = require("../services/articleService");
      const origCreate = articleService.createArticle;
      articleService.createArticle = jest.fn().mockRejectedValue(duplicateError);

      try {
        await articleController.createArticle(req, res, () => {});
        expect(statusCode).toBe(409);
        expect(responseBody.message).toMatch(/already exists/i);
      } finally {
        articleService.createArticle = origCreate;
      }
    });
  });
});
