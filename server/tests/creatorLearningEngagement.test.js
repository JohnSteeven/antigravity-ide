const fs = require("fs");
const path = require("path");

jest.mock("../models/Course", () => ({ find: jest.fn() }));
jest.mock("../models/CourseEnrollment", () => ({ find: jest.fn() }));
jest.mock("../models/CreatorProfile", () => ({ find: jest.fn() }));
jest.mock("../models/LearningEvent", () => ({ find: jest.fn() }));

const Course = require("../models/Course");
const CourseEnrollment = require("../models/CourseEnrollment");
const CreatorProfile = require("../models/CreatorProfile");
const LearningEvent = require("../models/LearningEvent");
const {
  QUALIFIED_EVENT_TYPES,
  aggregateTrustedLearningEngagement,
  normalizePeriod,
  reportLearningEngagement,
} = require("../creators/learningEngagementService");

const periodStart = new Date("2026-09-01T00:00:00.000Z");
const periodEnd = new Date("2026-10-01T00:00:00.000Z");
const query = (value) => ({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });

const fixtures = () => ({
  courses: [
    { _id: "course-a", creatorId: "creator-a", title: "A", slug: "a", isSystemOwned: false },
    { _id: "course-b", creatorId: "creator-a", title: "B", slug: "b", isSystemOwned: false },
    { _id: "course-c", creatorId: "creator-b", title: "C", slug: "c", isSystemOwned: false },
    { _id: "system-course", creatorId: "creator-a", title: "System", slug: "system", isSystemOwned: true },
  ],
  creatorProfiles: [
    { _id: "creator-a", userId: "creator-user-a" },
    { _id: "creator-b", userId: "creator-user-b" },
  ],
  enrollments: [
    { userId: "learner-a", courseId: "course-a", startedAt: new Date("2026-08-01T00:00:00.000Z") },
    { userId: "learner-a", courseId: "course-b", startedAt: new Date("2026-09-02T00:00:00.000Z") },
    { userId: "creator-user-a", courseId: "course-a", startedAt: new Date("2026-09-02T00:00:00.000Z") },
    { userId: "learner-b", courseId: "course-c", startedAt: new Date("2026-08-10T00:00:00.000Z") },
    { userId: "learner-c", courseId: "course-c", startedAt: new Date("2026-09-03T00:00:00.000Z"), completedAt: new Date("2026-09-10T00:00:00.000Z") },
  ],
  events: [
    { userId: "learner-a", courseId: "course-a", lessonId: "lesson-a", eventType: "lesson_completed", idempotencyKey: "one", occurredAt: new Date("2026-09-01T00:00:00.000Z") },
    { userId: "learner-a", courseId: "course-a", lessonId: "lesson-a", eventType: "lesson_completed", idempotencyKey: "forged-duplicate", occurredAt: new Date("2026-09-01T01:00:00.000Z") },
    { userId: "learner-a", courseId: "course-a", lessonId: "lesson-a", eventType: "quiz_passed", idempotencyKey: "quiz", occurredAt: new Date("2026-09-02T00:00:00.000Z") },
    { userId: "learner-a", courseId: "course-b", lessonId: "lesson-b", eventType: "exercise_passed", idempotencyKey: "exercise:block-1", occurredAt: new Date("2026-09-03T00:00:00.000Z") },
    { userId: "learner-a", courseId: "course-b", eventType: "course_completed", idempotencyKey: "complete", occurredAt: new Date("2026-09-04T00:00:00.000Z") },
    { userId: "learner-a", courseId: "course-b", lessonId: "late", eventType: "lesson_completed", occurredAt: new Date("2026-10-01T00:00:00.000Z") },
    { userId: "creator-user-a", courseId: "course-a", lessonId: "self", eventType: "lesson_completed", occurredAt: new Date("2026-09-05T00:00:00.000Z") },
    { userId: "learner-b", courseId: "course-c", lessonId: "lesson-c", eventType: "lesson_completed", occurredAt: new Date("2026-09-05T00:00:00.000Z") },
    { userId: "learner-a", courseId: "system-course", lessonId: "system", eventType: "lesson_completed", occurredAt: new Date("2026-09-05T00:00:00.000Z") },
    { userId: "learner-a", courseId: "course-a", eventType: "course_started", occurredAt: new Date("2026-09-06T00:00:00.000Z") },
  ],
});

describe("Phase 15 creator learning engagement measurement", () => {
  beforeEach(() => jest.clearAllMocks());

  test("deduplicates trusted actions, learners, days, completions, and creator self-activity", () => {
    const report = aggregateTrustedLearningEngagement({ ...fixtures(), periodStart, periodEnd });
    const creatorA = report.creators.find((creator) => creator.creatorId === "creator-a");
    const creatorB = report.creators.find((creator) => creator.creatorId === "creator-b");

    expect(creatorA.metrics).toMatchObject({
      enrolledLearners: 1, newEnrollments: 1, meaningfulLearners: 1,
      qualifiedLearningActions: 4, lessonCompletions: 1, quizPasses: 1,
      exercisePasses: 1, courseCompletions: 1,
      meaningfulLearningDays: 4, repeatMeaningfulLearnerDays: 3, learnersWithRepeatDays: 1,
    });
    expect(creatorB.metrics).toMatchObject({ meaningfulLearners: 2, qualifiedLearningActions: 2, courseCompletions: 1 });
    expect(report.courses.find((course) => course.courseId === "course-a").metrics.qualifiedLearningActions).toBe(2);
    expect(report.courses.some((course) => course.courseId === "system-course")).toBe(false);
    expect(report.metrics.qualifiedLearningActions).toBe(6);
  });

  test("uses exact start-inclusive/end-exclusive period boundaries", () => {
    expect(normalizePeriod({ periodStart, periodEnd })).toEqual({ start: periodStart, end: periodEnd });
    expect(() => normalizePeriod({ periodStart: periodEnd, periodEnd: periodStart })).toThrow("start-inclusive");
    expect(() => normalizePeriod({ periodStart, periodEnd: new Date("2028-01-01T00:00:00.000Z") })).toThrow("366 days");
  });

  test("database report queries only creator-owned non-system Courses and trusted event types", async () => {
    const data = fixtures();
    Course.find.mockReturnValue(query(data.courses.slice(0, 3)));
    CreatorProfile.find.mockReturnValue(query(data.creatorProfiles));
    CourseEnrollment.find.mockReturnValue(query(data.enrollments));
    LearningEvent.find.mockReturnValue(query(data.events));
    const report = await reportLearningEngagement({
      creatorId: "507f1f77bcf86cd799439011", courseId: "507f1f77bcf86cd799439012", periodStart, periodEnd,
      qualifiedLearningActions: 999999,
    });
    expect(Course.find).toHaveBeenCalledWith(expect.objectContaining({
      creatorId: "507f1f77bcf86cd799439011", _id: "507f1f77bcf86cd799439012", isSystemOwned: { $ne: true },
    }));
    expect(LearningEvent.find).toHaveBeenCalledWith(expect.objectContaining({ eventType: { $in: QUALIFIED_EVENT_TYPES } }));
    expect(report.authority).toMatch(/client engagement totals.*excluded/i);
  });

  test("reporting APIs are read-only and retain Creator/Admin authorization boundaries", () => {
    const studioRoutes = fs.readFileSync(path.join(__dirname, "..", "routes", "creatorStudioRoutes.js"), "utf8");
    const creatorRoutes = fs.readFileSync(path.join(__dirname, "..", "routes", "creatorRoutes.js"), "utf8");
    expect(studioRoutes).toContain('router.use(authenticate, requireActiveCreator)');
    expect(studioRoutes).toContain('router.get("/learning-engagement", controllers.learningEngagement)');
    expect(creatorRoutes).toContain('router.get("/admin/learning-engagement", authenticate, requireAdmin, controllers.getLearningEngagement)');
    expect(`${studioRoutes}\n${creatorRoutes}`).not.toMatch(/router\.(post|put|patch)\("\/(admin\/)?learning-engagement/);
  });
});
