const {
  canonicalCourses,
  htmlFoundations,
  cssFoundations,
  javascriptFoundations,
  pythonFoundations,
} = require("../../data/phase6Courses");
const { SYSTEM_LEARNING_USERNAME } = require("../../scripts/seedCodingCurriculum");

describe("Phase 6: Canonical Coding Curricula Quality & Structure", () => {
  const getCourseLessons = (course) =>
    course.lessons || (Array.isArray(course.modules) ? course.modules.flatMap((m) => m.lessons) : []);

  test("system author identity is defined and strictly system-owned", () => {
    expect(SYSTEM_LEARNING_USERNAME).toBe("myjourney-learning");
  });

  test("curricula tracks cover the 4 required domains", () => {
    expect(canonicalCourses).toHaveLength(4);
    const slugs = canonicalCourses.map((c) => c.slug);
    expect(slugs).toEqual([
      "html-foundations",
      "css-foundations",
      "javascript-foundations",
      "python-foundations",
    ]);
  });

  test("monetization types adhere strictly to Phase 6 tier rules", () => {
    // HTML and CSS are FREE
    expect(htmlFoundations.monetizationType).toBe("FREE");
    expect(cssFoundations.monetizationType).toBe("FREE");

    // JS and Python are PREMIUM_INCLUDED
    expect(javascriptFoundations.monetizationType).toBe("PREMIUM_INCLUDED");
    expect(pythonFoundations.monetizationType).toBe("PREMIUM_INCLUDED");
  });

  test("curricula lesson count meets specifications (HTML:12, CSS:13, JS:15, Python:15)", () => {
    expect(getCourseLessons(htmlFoundations)).toHaveLength(12);
    expect(getCourseLessons(cssFoundations)).toHaveLength(13);
    expect(getCourseLessons(javascriptFoundations)).toHaveLength(15);
    expect(getCourseLessons(pythonFoundations)).toHaveLength(15);

    const totalLessons = canonicalCourses.reduce((acc, c) => acc + getCourseLessons(c).length, 0);
    expect(totalLessons).toBe(55);
  });

  canonicalCourses.forEach((course) => {
    describe(`Course track: ${course.title} (${course.slug})`, () => {
      test("has required course metadata and outcomes", () => {
        expect(course.title).toBeTruthy();
        expect(course.description).toBeTruthy();
        const outcomes = course.learningOutcomes || course.learningObjectives;
        expect(Array.isArray(outcomes)).toBe(true);
        expect(outcomes.length).toBeGreaterThanOrEqual(3);
        expect(Array.isArray(course.prerequisites)).toBe(true);
      });

      test("each lesson has strict pedagogical structure and interactive components", () => {
        const lessons = getCourseLessons(course);
        expect(lessons.length).toBeGreaterThanOrEqual(12);

        lessons.forEach((lesson, index) => {
          expect(lesson.title).toBeTruthy();
          expect(["coding", "project", "quiz"]).toContain(lesson.lessonType || lesson.lessonFormat);
          const body = lesson.body || lesson.explanation;
          expect(typeof body).toBe("string");
          expect(body.length).toBeGreaterThan(50);

          // Coding Blocks validation
          expect(Array.isArray(lesson.codingBlocks)).toBe(true);
          expect(lesson.codingBlocks.length).toBeGreaterThanOrEqual(1);

          lesson.codingBlocks.forEach((block) => {
            expect(["html", "css", "javascript", "python"]).toContain(block.language);
            expect(typeof block.starterCode).toBe("string");
            expect(typeof block.solutionCode).toBe("string");
            expect(block.solutionCode.length).toBeGreaterThan(0);
            expect(Array.isArray(block.hints)).toBe(true);
            expect(block.hints.length).toBeGreaterThanOrEqual(1);
            expect(Array.isArray(block.validationRules)).toBe(true);
            expect(block.validationRules.length).toBeGreaterThanOrEqual(1);

            block.validationRules.forEach((rule) => {
              expect(rule.type).toBeTruthy();
            });
          });

          // Quiz questions validation
          expect(Array.isArray(lesson.quizQuestions)).toBe(true);
          expect(lesson.quizQuestions.length).toBeGreaterThanOrEqual(1);

          lesson.quizQuestions.forEach((q) => {
            expect(q.question.length).toBeGreaterThan(5);
            expect(Array.isArray(q.options)).toBe(true);
            expect(q.options.length).toBeGreaterThanOrEqual(2);
            expect(q.correctOptionIndex).toBeGreaterThanOrEqual(0);
            expect(q.correctOptionIndex).toBeLessThan(q.options.length);
            expect(q.explanation.length).toBeGreaterThan(5);
          });
        });
      });
    });
  });
});
