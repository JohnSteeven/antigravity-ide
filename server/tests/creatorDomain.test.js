const fs = require("fs");
const path = require("path");
const CreatorApplication = require("../models/CreatorApplication");
const CreatorProfile = require("../models/CreatorProfile");
const Course = require("../models/Course");
const CourseModule = require("../models/CourseModule");
const CourseLesson = require("../models/CourseLesson");
const { APPLICATION_TRANSITIONS, CREATOR_CONTENT_TYPES, RECOMMENDED_STORY_LAYOUTS } = require("../creators/constants");
const { assertFixtureEnvironment, buildCreatorLearnFixtures } = require("../creators/fixtures");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

describe("Creator and structured Course domain", () => {
  test("approval and activation are separate server-authoritative transitions", () => {
    expect(APPLICATION_TRANSITIONS.under_review).toContain("approved");
    expect(APPLICATION_TRANSITIONS.under_review).not.toContain("active");
    expect(APPLICATION_TRANSITIONS.approved).toContain("active");
    expect(APPLICATION_TRANSITIONS.rejected).toEqual([]);
  });

  test("Creator, content type, Topic, and access remain independent concepts", () => {
    expect(CREATOR_CONTENT_TYPES).toEqual(expect.arrayContaining(["article", "story", "course", "video", "podcast", "resource"]));
    const articleSource = read("server", "models", "Article.js");
    expect(articleSource).toContain("creatorProfileId");
    expect(articleSource).toContain("category");
    expect(articleSource).toContain("accessLevel");
    expect(read("server", "models", "Topic.js")).toContain("TopicSchema");
  });

  test("Creator application verification fields are private by default", () => {
    ["legalName", "country", "professionalBackground", "motivation", "supportingDocuments"].forEach((field) => {
      expect(CreatorApplication.schema.path(field).options.select).toBe(false);
    });
  });

  test("Creator capability is not implemented as a User role", () => {
    const userSource = read("server", "models", "User.js");
    expect(userSource).not.toMatch(/enum\s*:\s*\[[^\]]*["']Creator["']/);
    expect(CreatorProfile.schema.path("status").enumValues).toContain("active");
  });

  test("Courses, Modules, and Lessons are separate stable records", () => {
    expect(Course.schema.path("structuralVersion")).toBeDefined();
    expect(CourseModule.schema.path("stableKey")).toBeDefined();
    expect(CourseLesson.schema.path("stableKey")).toBeDefined();
    expect(CourseLesson.schema.path("body").options.select).toBe(false);
    expect(CourseLesson.schema.path("transcript").options.select).toBe(false);
  });

  test("Story creation recommends six approved layouts without creating an engine", () => {
    expect(RECOMMENDED_STORY_LAYOUTS).toHaveLength(6);
    expect(RECOMMENDED_STORY_LAYOUTS).toContain("chapter-journey");
    expect(read("server", "creators", "studioService.js")).toContain("prepareStory");
  });

  test("development fixtures cover realistic states and fail closed in production", () => {
    const fixtures = buildCreatorLearnFixtures({ environment: "test" });
    expect(fixtures.personas.map((item) => item.applicationStatus)).toEqual(expect.arrayContaining(["active", "approved", "more_info_required"]));
    expect(new Set(fixtures.content.map((item) => item.contentType))).toEqual(new Set(["article", "story", "course", "resource", "video", "podcast"]));
    expect(fixtures.economy).toMatchObject({ active: false, earningsAmount: null, payoutAvailable: false });
    expect(() => assertFixtureEnvironment("production")).toThrow(expect.objectContaining({ code: "PRODUCTION_FIXTURES_DISABLED" }));
  });
});
