const mongoose = require("mongoose");
const courseService = require("../../learn/courseService");
const Course = require("../../models/Course");
const CourseModule = require("../../models/CourseModule");
const CourseLesson = require("../../models/CourseLesson");
const CourseEnrollment = require("../../models/CourseEnrollment");
const LearningEvent = require("../../models/LearningEvent");

describe("Phase 7: Learn Mastery & Progress Reliability Suite", () => {
  const testUserId = new mongoose.Types.ObjectId().toString();
  const testCourseId = new mongoose.Types.ObjectId();
  const testModule1Id = new mongoose.Types.ObjectId();
  const testModule2Id = new mongoose.Types.ObjectId();

  const lessonAId = new mongoose.Types.ObjectId();
  const lessonBId = new mongoose.Types.ObjectId();
  const lessonCId = new mongoose.Types.ObjectId();

  const mockEligibleLessons = [
    { _id: lessonAId, stableKey: "key-a", moduleId: testModule1Id, title: "Lesson A", order: 1 },
    { _id: lessonBId, stableKey: "key-b", moduleId: testModule1Id, title: "Lesson B", order: 2 },
    { _id: lessonCId, stableKey: "key-c", moduleId: testModule2Id, title: "Lesson C", order: 1 },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Group 1: Canonical Helpers & Server-Derived State", () => {
    test("1. deriveLessonState returns not_started when no startedAt or interaction exists", () => {
      const state = courseService.deriveLessonState(null);
      expect(state.state).toBe("not_started");
      expect(state.started).toBe(false);
      expect(state.completed).toBe(false);
      expect(state.exercisePassed).toBe(false);
      expect(state.quizPassed).toBe(false);
      expect(state.bestQuizScore).toBe(0);
      expect(state.quizAttempts).toBe(0);
    });

    test("2. deriveLessonState returns in_progress when startedAt, exerciseAttempts, quizAttempts, or positionSeconds > 0", () => {
      const state1 = courseService.deriveLessonState({ startedAt: new Date() });
      expect(state1.state).toBe("in_progress");

      const state2 = courseService.deriveLessonState({ exerciseAttempts: 1 });
      expect(state2.state).toBe("in_progress");

      const state3 = courseService.deriveLessonState({ positionSeconds: 45 });
      expect(state3.state).toBe("in_progress");
    });

    test("3. deriveLessonState returns completed when completedAt is present, preserving factual details", () => {
      const completedAt = new Date();
      const state = courseService.deriveLessonState({
        startedAt: new Date(Date.now() - 3600000),
        completedAt,
        exercisePassed: true,
        exerciseAttempts: 2,
        quizPassed: true,
        quizScore: 90,
        bestQuizScore: 100,
        quizAttempts: 3,
        solutionViewed: false,
        positionSeconds: 120,
      });

      expect(state.state).toBe("completed");
      expect(state.completed).toBe(true);
      expect(state.exercisePassed).toBe(true);
      expect(state.quizPassed).toBe(true);
      expect(state.quizScore).toBe(90);
      expect(state.bestQuizScore).toBe(100);
      expect(state.quizAttempts).toBe(3);
    });

    test("4. calculateEnrollmentProgress accurately computes percentage using eligible lesson denominator and ignores draft/deleted lessons", () => {
      const enrollment = {
        status: "active",
        lessonProgress: [
          { lessonStableKey: "key-a", completedAt: new Date() },
          { lessonStableKey: "deleted-lesson-key", completedAt: new Date() },
        ],
      };

      const progress = courseService.calculateEnrollmentProgress(enrollment, mockEligibleLessons);
      expect(progress.completedLessonCount).toBe(1);
      expect(progress.totalEligibleLessons).toBe(3);
      expect(progress.progressPercent).toBe(33);
      expect(progress.isCompleted).toBe(false);
    });

    test("5. calculateEnrollmentProgress enforces historical completion invariant: returns 100% progress for already-completed course even if new lessons are published", () => {
      const originalCompletedAt = new Date("2026-01-15T10:00:00Z");
      const historicallyCompletedEnrollment = {
        status: "completed",
        completedAt: originalCompletedAt,
        lessonProgress: [
          { lessonStableKey: "key-a", completedAt: originalCompletedAt },
          { lessonStableKey: "key-b", completedAt: originalCompletedAt },
        ],
      };

      const progress = courseService.calculateEnrollmentProgress(historicallyCompletedEnrollment, mockEligibleLessons);
      expect(progress.isCompleted).toBe(true);
      expect(progress.progressPercent).toBe(100);
      expect(progress.completedAt).toEqual(originalCompletedAt);
    });
  });

  describe("Group 2: Unified Resume Priority Resolution", () => {
    test("6. resolveNextLesson prioritizes current incomplete lesson when learner is midway through it", () => {
      const enrollment = {
        currentLessonId: String(lessonBId),
        lessonProgress: [
          { lessonStableKey: "key-a", completedAt: new Date() },
          { lessonStableKey: "key-b", startedAt: new Date(), positionSeconds: 30 },
        ],
      };

      const next = courseService.resolveNextLesson(enrollment, mockEligibleLessons);
      expect(next).not.toBeNull();
      expect(String(next._id)).toBe(String(lessonBId));
    });

    test("7. resolveNextLesson prioritizes next incomplete lesson in curriculum sequence after current completed lesson", () => {
      const enrollment = {
        currentLessonId: String(lessonAId),
        lessonProgress: [
          { lessonStableKey: "key-a", completedAt: new Date() },
        ],
      };

      const next = courseService.resolveNextLesson(enrollment, mockEligibleLessons);
      expect(next).not.toBeNull();
      expect(String(next._id)).toBe(String(lessonBId));
    });

    test("8. resolveNextLesson falls back to first incomplete lesson if current lesson is completed and last in sequence", () => {
      const enrollment = {
        currentLessonId: String(lessonCId),
        lessonProgress: [
          { lessonStableKey: "key-b", completedAt: new Date() },
          { lessonStableKey: "key-c", completedAt: new Date() },
        ],
      };

      const next = courseService.resolveNextLesson(enrollment, mockEligibleLessons);
      expect(next).not.toBeNull();
      expect(String(next._id)).toBe(String(lessonAId));
    });

    test("9. resolveNextLesson returns null when all eligible lessons in course are completed", () => {
      const enrollment = {
        currentLessonId: String(lessonCId),
        lessonProgress: [
          { lessonStableKey: "key-a", completedAt: new Date() },
          { lessonStableKey: "key-b", completedAt: new Date() },
          { lessonStableKey: "key-c", completedAt: new Date() },
        ],
      };

      const next = courseService.resolveNextLesson(enrollment, mockEligibleLessons);
      expect(next).toBeNull();
    });
  });

  describe("Group 3: Quiz Retries & Sticky Passing", () => {
    test("10. evaluateQuiz updates bestQuizScore = max(best, latest) and increments quizAttempts on repeated attempts", async () => {
      const lessonWithQuiz = {
        _id: lessonAId,
        stableKey: "key-a",
        courseId: testCourseId,
        quizQuestions: [
          { id: "q1", question: "Q1?", correctOptionIndex: 1, options: [{ id: "o1", text: "A" }, { id: "o2", text: "B" }] },
          { id: "q2", question: "Q2?", correctOptionIndex: 0, options: [{ id: "o3", text: "C" }, { id: "o4", text: "D" }] },
        ],
      };

      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        lessonProgress: [
          {
            lessonId: lessonAId,
            lessonStableKey: "key-a",
            quizScore: 50,
            bestQuizScore: 50,
            quizAttempts: 1,
            quizPassed: false,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: testCourseId, slug: "test-course", accessLevel: "free" }),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(lessonWithQuiz),
        }),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);
      jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      const res1 = await courseService.evaluateQuiz({
        courseSlug: "test-course",
        lessonId: lessonAId,
        userId: testUserId,
        answers: { q1: 1, q2: 0 },
      });

      expect(res1.passed).toBe(true);
      expect(res1.score).toBe(100);
      expect(res1.bestScore).toBe(100);
      expect(res1.attempts).toBe(2);
      expect(mockEnrollment.lessonProgress[0].bestQuizScore).toBe(100);
      expect(mockEnrollment.lessonProgress[0].quizAttempts).toBe(2);

      const res2 = await courseService.evaluateQuiz({
        courseSlug: "test-course",
        lessonId: lessonAId,
        userId: testUserId,
        answers: { q1: 1, q2: 1 },
      });

      expect(res2.score).toBe(50);
      expect(res2.bestScore).toBe(100);
      expect(res2.attempts).toBe(3);
      expect(mockEnrollment.lessonProgress[0].bestQuizScore).toBe(100);
      expect(mockEnrollment.lessonProgress[0].quizAttempts).toBe(3);
    });

    test("11. evaluateQuiz preserves sticky quizPassed = true across subsequent failing retries", async () => {
      const lessonWithQuiz = {
        _id: lessonAId,
        stableKey: "key-a",
        courseId: testCourseId,
        quizQuestions: [
          { id: "q1", question: "Q1?", correctOptionIndex: 0, options: [{ id: "o1", text: "A" }, { id: "o2", text: "B" }] },
        ],
      };

      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        lessonProgress: [
          {
            lessonId: lessonAId,
            lessonStableKey: "key-a",
            quizScore: 100,
            bestQuizScore: 100,
            quizAttempts: 1,
            quizPassed: true,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: testCourseId, slug: "test-course", accessLevel: "free" }),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(lessonWithQuiz),
        }),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);
      jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      const res = await courseService.evaluateQuiz({
        courseSlug: "test-course",
        lessonId: lessonAId,
        userId: testUserId,
        answers: { q1: 1 },
      });

      expect(res.passed).toBe(false);
      expect(mockEnrollment.lessonProgress[0].quizPassed).toBe(true);
    });

    test("12. evaluateQuiz returns bestScore and attempts in its API response payload", async () => {
      const lessonWithQuiz = {
        _id: lessonAId,
        stableKey: "key-a",
        courseId: testCourseId,
        quizQuestions: [
          { id: "q1", question: "Q1?", correctOptionIndex: 0, options: [{ id: "o1", text: "A" }, { id: "o2", text: "B" }] },
        ],
      };

      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        lessonProgress: [],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: testCourseId, slug: "test-course", accessLevel: "free" }),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(lessonWithQuiz),
        }),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);
      jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      const res = await courseService.evaluateQuiz({
        courseSlug: "test-course",
        lessonId: lessonAId,
        userId: testUserId,
        answers: { q1: 0 },
      });

      expect(res).toHaveProperty("success", true);
      expect(res).toHaveProperty("score", 100);
      expect(res).toHaveProperty("bestScore", 100);
      expect(res).toHaveProperty("attempts", 1);
    });
  });

  describe("Group 4: Anti-Forgery & Trust Guardrails", () => {
    test("13. recordProgress rejects completion of coding lesson if exercisePassed is false", async () => {
      const codingLesson = {
        _id: lessonAId,
        stableKey: "key-a",
        courseId: testCourseId,
        lessonType: "coding",
        codingBlocks: [{ id: "b1", starterCode: "let x = 1;" }],
      };

      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        lessonProgress: [
          { lessonId: lessonAId, lessonStableKey: "key-a", exercisePassed: false },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: testCourseId, slug: "test-course", accessLevel: "free" }),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(codingLesson),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      await expect(
        courseService.recordProgress({
          userId: testUserId,
          courseId: testCourseId,
          lessonId: lessonAId,
          completed: true,
        })
      ).rejects.toMatchObject({
        status: 422,
        code: "EXERCISE_COMPLETION_REQUIRED",
      });
    });

    test("14. recordProgress rejects completion of quiz lesson if quizPassed is false", async () => {
      const quizLesson = {
        _id: lessonAId,
        stableKey: "key-a",
        courseId: testCourseId,
        lessonType: "quiz",
        quizQuestions: [{ id: "q1", question: "Q?" }],
      };

      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        lessonProgress: [
          { lessonId: lessonAId, lessonStableKey: "key-a", quizPassed: false },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: testCourseId, slug: "test-course", accessLevel: "free" }),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(quizLesson),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      await expect(
        courseService.recordProgress({
          userId: testUserId,
          courseId: testCourseId,
          lessonId: lessonAId,
          completed: true,
        })
      ).rejects.toMatchObject({
        status: 422,
        code: "QUIZ_COMPLETION_REQUIRED",
      });
    });

    test("15. Viewing official solution does not grant exercisePassed and viewing solution does not disqualify learner", async () => {
      const lessonWithSolution = {
        _id: lessonAId,
        stableKey: "key-a",
        courseId: testCourseId,
        codingBlocks: [{ id: "blk-1", solutionCode: "const x = 42;" }],
      };

      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        lessonProgress: [
          {
            lessonId: lessonAId,
            lessonStableKey: "key-a",
            exercisePassed: false,
            solutionViewed: false,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: testCourseId, slug: "test-course", accessLevel: "free" }),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(lessonWithSolution),
        }),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);
      jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      const revealed = await courseService.revealSolution({
        courseSlug: "test-course",
        lessonId: lessonAId,
        userId: testUserId,
        blockId: "blk-1",
      });

      expect(revealed.solutionCode).toBe("const x = 42;");
      expect(mockEnrollment.lessonProgress[0].solutionViewed).toBe(true);
      expect(mockEnrollment.lessonProgress[0].exercisePassed).toBe(false);
    });
  });

  describe("Group 5: Course Completion Lifecycle & Events", () => {
    test("16. recordProgress automatically marks enrollment completed when last eligible lesson is finished", async () => {
      const lessonSingle = {
        _id: lessonAId,
        stableKey: "key-a",
        courseId: testCourseId,
        lessonType: "text",
        completionMode: "open",
      };

      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        status: "active",
        lessonProgress: [],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: testCourseId, slug: "test-course", accessLevel: "free", lessonCount: 1 }),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(lessonSingle),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);
      jest.spyOn(CourseModule, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: testModule1Id, order: 1 }]),
        }),
      });
      jest.spyOn(CourseLesson, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([lessonSingle]),
        }),
      });
      jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      await courseService.recordProgress({
        userId: testUserId,
        courseId: testCourseId,
        lessonId: lessonAId,
        completed: true,
      });

      expect(mockEnrollment.status).toBe("completed");
      expect(mockEnrollment.completedAt).toBeDefined();
    });

    test("17. reconcileCourseCompletion emits course_completed LearningEvent with deterministic idempotencyKey on initial completion", async () => {
      const mockEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        status: "active",
        completedAt: null,
      };

      const eventSpy = jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      await courseService.reconcileCourseCompletion(mockEnrollment, mockEligibleLessons, testUserId, "free");

      expect(mockEnrollment.status).toBe("completed");
      expect(mockEnrollment.completedAt).toBeDefined();
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          courseId: testCourseId,
          eventType: "course_completed",
          idempotencyKey: `course_completed:${testCourseId}:${testUserId}`,
          entitlementPlan: "free",
        })
      );
    });

    test("18. Subsequent progress calls on completed course do NOT emit duplicate course_completed events (idempotent)", async () => {
      const alreadyCompletedEnrollment = {
        userId: testUserId,
        courseId: testCourseId,
        status: "completed",
        completedAt: new Date("2026-01-01T00:00:00Z"),
      };

      const eventSpy = jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      await courseService.reconcileCourseCompletion(alreadyCompletedEnrollment, mockEligibleLessons, testUserId, "free");

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });
});
