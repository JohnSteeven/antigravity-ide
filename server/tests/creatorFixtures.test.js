const {
  DEVELOPMENT_FIXTURES,
  assertFixtureEnvironment,
  buildCreatorLearnFixtures,
} = require("../creators/fixtures");
const { RECOMMENDED_STORY_LAYOUTS } = require("../creators/constants");

describe("Creator Demo Fixtures Data Integrity and Safety", () => {
  test("fails closed in production environment", () => {
    expect(() => assertFixtureEnvironment("production")).toThrow(
      expect.objectContaining({ code: "PRODUCTION_FIXTURES_DISABLED" })
    );
    expect(() => assertFixtureEnvironment("test")).not.toThrow();
    expect(() => assertFixtureEnvironment("development")).not.toThrow();
  });

  test("defines exactly 12 active public Creators for directory and profile testing", () => {
    const publicCreators = DEVELOPMENT_FIXTURES.personas.filter((p) => p.isPublic);
    expect(publicCreators).toHaveLength(12);

    publicCreators.forEach((creator) => {
      expect(creator.applicationStatus).toBe("active");
      expect(creator.profileStatus).toBe("active");
      expect(creator.slug).toBeTruthy();
      expect(creator.displayName).toBeTruthy();
      expect(creator.headline).toBeTruthy();
      expect(creator.biography).toBeTruthy();
      expect(Array.isArray(creator.specialties)).toBe(true);
      expect(creator.specialties.length).toBeGreaterThan(0);
      expect(Array.isArray(creator.languages)).toBe(true);
      expect(creator.languages.length).toBeGreaterThan(0);
      expect(Array.isArray(creator.creatorTypes)).toBe(true);
    });
  });

  test("preserves workflow-only test personas without exposing them as public active creators", () => {
    const nonPublicPersonas = DEVELOPMENT_FIXTURES.personas.filter((p) => !p.isPublic);
    expect(nonPublicPersonas.length).toBeGreaterThanOrEqual(2);

    const statuses = nonPublicPersonas.map((p) => p.applicationStatus);
    expect(statuses).toContain("approved");
    expect(statuses).toContain("more_info_required");

    // Total personas must cover active, approved, and more_info_required
    const allStatuses = DEVELOPMENT_FIXTURES.personas.map((p) => p.applicationStatus);
    expect(allStatuses).toEqual(expect.arrayContaining(["active", "approved", "more_info_required"]));
  });

  test("all Creator slugs and keys are distinct and properly formatted", () => {
    const slugs = DEVELOPMENT_FIXTURES.personas.map((p) => p.slug);
    const keys = DEVELOPMENT_FIXTURES.personas.map((p) => p.key);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(keys).size).toBe(keys.length);

    slugs.forEach((slug) => {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });
  });

  test("all Topics are deduplicated and have valid slugs", () => {
    const topicSlugs = DEVELOPMENT_FIXTURES.topics.map((t) => t.slug);
    const topicNames = DEVELOPMENT_FIXTURES.topics.map((t) => t.name.toLowerCase());

    expect(new Set(topicSlugs).size).toBe(topicSlugs.length);
    expect(new Set(topicNames).size).toBe(topicNames.length);

    topicSlugs.forEach((slug) => {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });
  });

  test("content fixtures cover all 6 primary content types with valid creator ownership", () => {
    const personaKeys = new Set(DEVELOPMENT_FIXTURES.personas.map((p) => p.key));
    const contentTypes = new Set(DEVELOPMENT_FIXTURES.content.map((c) => c.contentType));

    expect(contentTypes).toEqual(
      new Set(["article", "story", "course", "resource", "video", "podcast"])
    );

    DEVELOPMENT_FIXTURES.content.forEach((item) => {
      expect(personaKeys.has(item.owner)).toBe(true);
      expect(item.title).toBeTruthy();
      expect(item.slug).toBeTruthy();
      expect(["free", "premium"]).toContain(item.accessLevel);
    });

    // Check exam definition metadata
    expect(Array.isArray(DEVELOPMENT_FIXTURES.exams)).toBe(true);
    expect(DEVELOPMENT_FIXTURES.exams.length).toBeGreaterThan(0);
    DEVELOPMENT_FIXTURES.exams.forEach((exam) => {
      expect(personaKeys.has(exam.owner)).toBe(true);
      expect(exam.assessmentEngineAvailable).toBe(false);
    });
  });

  test("courses contain structured modules and lessons with stable keys and preview flags", () => {
    const courses = DEVELOPMENT_FIXTURES.content.filter((c) => c.contentType === "course");
    expect(courses.length).toBeGreaterThanOrEqual(6);

    courses.forEach((course) => {
      expect(Array.isArray(course.modules)).toBe(true);
      expect(course.modules.length).toBeGreaterThan(0);

      let totalLessons = 0;
      course.modules.forEach((module, modIdx) => {
        expect(module.stableKey).toBeTruthy();
        expect(module.title).toBeTruthy();
        expect(module.order).toBe(modIdx);
        expect(Array.isArray(module.lessons)).toBe(true);
        expect(module.lessons.length).toBeGreaterThan(0);

        module.lessons.forEach((lesson, lesIdx) => {
          expect(lesson.stableKey).toBeTruthy();
          expect(lesson.title).toBeTruthy();
          expect(lesson.order).toBe(lesIdx);
          expect(lesson.lessonType).toBeTruthy();
          totalLessons++;
        });
      });

      // If course is premium, verify at least one lesson has isPreview: true
      if (course.accessLevel === "premium") {
        const hasPreview = course.modules.some((m) => m.lessons.some((l) => l.isPreview === true));
        expect(hasPreview).toBe(true);
      }
    });
  });

  test("stories use approved story layouts and valid sections", () => {
    const stories = DEVELOPMENT_FIXTURES.content.filter((c) => c.contentType === "story");
    expect(stories.length).toBeGreaterThanOrEqual(3);

    stories.forEach((story) => {
      expect(RECOMMENDED_STORY_LAYOUTS).toContain(story.storyLayout);
      expect(Array.isArray(story.storySections)).toBe(true);
      expect(story.storySections.length).toBeGreaterThan(0);
    });
  });

  test("follow graph contains no self-follows and no duplicate creator entries", () => {
    const follows = DEVELOPMENT_FIXTURES.follows || [];
    expect(follows.length).toBe(12);

    const followCreatorKeys = follows.map((f) => f.creatorKey);
    expect(new Set(followCreatorKeys).size).toBe(follows.length);

    const publicKeys = new Set(DEVELOPMENT_FIXTURES.personas.filter((p) => p.isPublic).map((p) => p.key));
    follows.forEach((f) => {
      expect(publicKeys.has(f.creatorKey)).toBe(true);
      expect(typeof f.followerCount).toBe("number");
      expect(f.followerCount).toBeGreaterThan(0);
    });
  });

  test("creator economy reflects inactive program without fabricated revenue", () => {
    expect(DEVELOPMENT_FIXTURES.economy).toEqual({
      active: false,
      earningsAmount: null,
      payoutAvailable: false,
    });
  });

  test("buildCreatorLearnFixtures returns independent deep clones", () => {
    const clone1 = buildCreatorLearnFixtures({ environment: "test" });
    const clone2 = buildCreatorLearnFixtures({ environment: "test" });

    expect(clone1).toEqual(clone2);
    expect(clone1).not.toBe(clone2);
    expect(clone1.personas).not.toBe(clone2.personas);
  });
});
