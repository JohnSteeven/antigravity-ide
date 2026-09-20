const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const learnRoutes = require("../../routes/learnRoutes");
const User = require("../../models/User");
const entitlementService = require("../../services/entitlementService");
const accessPolicy = require("../../learn/accessPolicy");
const courseService = require("../../learn/courseService");
const Course = require("../../models/Course");
const CourseEnrollment = require("../../models/CourseEnrollment");
const CourseLesson = require("../../models/CourseLesson");
const LearningEvent = require("../../models/LearningEvent");
const { runExerciseValidation } = require("../../../src/features/learn/components/ValidationRunner.cjs");

describe("Phase 6: Coding Progress Enforcement & Client Validation Engine", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Server Progress Enforcement Guardrails", () => {
    test("recordProgress blocks completing a coding lesson if exercise was not passed", async () => {
      const mockCourse = {
        _id: "course-101",
        slug: "course-101",
        accessLevel: "free",
        structuralVersion: 1,
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-code-1",
        courseId: "course-101",
        stableKey: "stable-code-1",
        lessonType: "coding",
        codingBlocks: [{ id: "b1" }],
        contentVersion: 1,
      };

      const mockEnrollment = {
        userId: "user-1",
        courseId: "course-101",
        status: "active",
        lessonProgress: [
          {
            lessonId: "lesson-code-1",
            lessonStableKey: "stable-code-1",
            exercisePassed: false, // NOT PASSED
            completed: false,
          },
        ],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLesson),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      await expect(
        courseService.recordProgress({
          userId: "user-1",
          courseId: "course-101",
          lessonId: "lesson-code-1",
          completed: true,
        })
      ).rejects.toMatchObject({
        status: 422,
        code: "EXERCISE_COMPLETION_REQUIRED",
      });
    });

    test("recordProgress rejects completing a coding lesson when client attempts to inject exercisePassed:true directly in payload", async () => {
      const mockCourse = {
        _id: "course-101",
        slug: "course-101",
        accessLevel: "free",
        structuralVersion: 1,
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-code-1",
        courseId: "course-101",
        stableKey: "stable-code-1",
        lessonType: "coding",
        codingBlocks: [{ id: "b1" }],
        contentVersion: 1,
      };

      // Server enrollment record has exercisePassed: false
      const mockEnrollment = {
        userId: "user-1",
        courseId: "course-101",
        status: "active",
        lessonProgress: [
          {
            lessonId: "lesson-code-1",
            lessonStableKey: "stable-code-1",
            exercisePassed: false,
            completed: false,
          },
        ],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLesson),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      // Even if client injects exercisePassed: true into the generic progress body,
      // the server ignores client-supplied flags and relies exclusively on server-stored enrollment state
      await expect(
        courseService.recordProgress({
          userId: "user-1",
          courseId: "course-101",
          lessonId: "lesson-code-1",
          completed: true,
          exercisePassed: true, // INJECTED / FORGED BY CLIENT
        })
      ).rejects.toMatchObject({
        status: 422,
        code: "EXERCISE_COMPLETION_REQUIRED",
      });
    });

    test("recordProgress blocks completing a quiz lesson if quiz was not passed", async () => {
      const mockCourse = {
        _id: "course-101",
        slug: "course-101",
        accessLevel: "free",
        structuralVersion: 1,
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-quiz-1",
        courseId: "course-101",
        stableKey: "stable-quiz-1",
        lessonType: "quiz",
        quizQuestions: [{ id: "q1" }],
        contentVersion: 1,
      };

      const mockEnrollment = {
        userId: "user-1",
        courseId: "course-101",
        status: "active",
        lessonProgress: [
          {
            lessonId: "lesson-quiz-1",
            lessonStableKey: "stable-quiz-1",
            quizPassed: false, // NOT PASSED
            completed: false,
          },
        ],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLesson),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      await expect(
        courseService.recordProgress({
          userId: "user-1",
          courseId: "course-101",
          lessonId: "lesson-quiz-1",
          completed: true,
        })
      ).rejects.toMatchObject({
        status: 422,
        code: "QUIZ_COMPLETION_REQUIRED",
      });
    });

    test("recordProgress allows completing a coding lesson when exercisePassed is true", async () => {
      const mockCourse = {
        _id: "course-101",
        slug: "course-101",
        accessLevel: "free",
        structuralVersion: 1,
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-code-2",
        courseId: "course-101",
        stableKey: "stable-code-2",
        lessonType: "coding",
        codingBlocks: [{ id: "b1" }],
        contentVersion: 1,
      };

      const mockEnrollment = {
        userId: "user-1",
        courseId: "course-101",
        status: "active",
        lessonProgress: [
          {
            lessonId: "lesson-code-2",
            lessonStableKey: "stable-code-2",
            exercisePassed: true,
            completed: false,
          },
        ],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLesson),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);
      jest.spyOn(CourseLesson, "countDocuments").mockResolvedValue(5);
      jest.spyOn(LearningEvent, "create").mockResolvedValue({});

      const result = await courseService.recordProgress({
        userId: "user-1",
        courseId: "course-101",
        lessonId: "lesson-code-2",
        completed: true,
      });

      expect(mockEnrollment.lessonProgress[0].completedAt).toBeDefined();
      expect(result).toBe(mockEnrollment);
    });

    test("recordExerciseAttempt increments attempts and updates exercisePassed flag", async () => {
      const mockCourse = {
        _id: "course-101",
        slug: "course-101",
        accessLevel: "free",
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-code-3",
        courseId: "course-101",
        stableKey: "stable-code-3",
        contentVersion: 1,
        codingBlocks: [{ id: "block-x" }],
      };

      const mockEnrollment = {
        userId: "user-1",
        courseId: "course-101",
        status: "active",
        lessonProgress: [],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLesson),
      });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      const attemptResult = await courseService.recordExerciseAttempt({
        userId: "user-1",
        courseId: "course-101",
        lessonId: "lesson-code-3",
        blockId: "block-x",
        passed: true,
      });

      expect(attemptResult.recorded).toBe(true);
      expect(attemptResult.exercisePassed).toBe(true);
      expect(attemptResult.exerciseAttempts).toBe(1);
      expect(mockEnrollment.lessonProgress[0].exercisePassed).toBe(true);
      expect(mockEnrollment.lessonProgress[0].exerciseAttempts).toBe(1);
    });
  });

  describe("Client-Side ValidationRunner Logic", () => {
    test("validates code_contains rule", () => {
      const code = "console.log('Hello');";
      const rules = [
        { type: "code_contains", value: "console.log", message: "Must log to console" },
      ];
      const result = runExerciseValidation({ language: "javascript", code, rules });
      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    test("fails code_contains rule when required substring is missing", () => {
      const code = "let x = 10;";
      const rules = [
        { type: "code_contains", value: "console.log", message: "Must log to console" },
      ];
      const result = runExerciseValidation({ language: "javascript", code, rules });
      expect(result.passed).toBe(false);
      expect(result.checks[0].passed).toBe(false);
      expect(result.checks[0].message).toBe("Must log to console");
    });

    test("validates output_contains rule against execution output", () => {
      const output = { stdout: "Sum: 42\nDone." };
      const rules = [
        { type: "output_contains", value: "42", message: "Output must contain 42" },
      ];
      const result = runExerciseValidation({ language: "python", code: "print('Sum: 42')", rules, executionOutput: output });
      expect(result.passed).toBe(true);
    });

    test("validates pattern regex rule", () => {
      const code = "function calculateTotal(items) { return 100; }";
      const rules = [
        { type: "pattern", pattern: "function\\s+\\w+", message: "Must declare a function" },
      ];
      const result = runExerciseValidation({ language: "javascript", code, rules });
      expect(result.passed).toBe(true);
    });
  });

  describe("Explicit Anti-Forgery & Trust Model Verification", () => {
    let app;
    const testUserId = "507f1f77bcf86cd799439011";
    const bearerToken = `Bearer ${jwt.sign({ sub: testUserId, tokenVersion: 0 }, env.jwtAccessSecret, { expiresIn: "1h" })}`;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use("/api/learn", learnRoutes);
      app.use((err, req, res, _next) => {
        res.status(err.status || 500).json({ code: err.code || "INTERNAL_ERROR", message: err.message });
      });

      jest.spyOn(User, "findById").mockResolvedValue({
        _id: testUserId,
        status: "ACTIVE",
        tokenVersion: 0,
        isDeleted: false,
      });
      jest.spyOn(LearningEvent, "create").mockResolvedValue({});
      jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue({ plan: "free", entitlements: {} });
    });

    test("1. arbitrary userId cannot be supplied in progress request (server binds to authenticated req.user)", async () => {
      const mockCourse = { _id: "course-101", slug: "course-101", accessLevel: "free", publicationStatus: "published", isDeleted: false };
      const mockLesson = { _id: "lesson-code-1", courseId: "course-101", stableKey: "stable-1", lessonType: "coding", contentVersion: 1 };
      const mockEnrollment = {
        userId: testUserId,
        courseId: "course-101",
        status: "active",
        lessonProgress: [{ lessonId: "lesson-code-1", lessonStableKey: "stable-1", exercisePassed: false, completed: false }],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockLesson) });
      const enrollmentSpy = jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      // Attempt to supply an arbitrary victim userId
      const response = await request(app)
        .patch("/api/learn/courses/course-101/progress")
        .set("Authorization", bearerToken)
        .send({
          userId: "arbitrary-victim-user-999",
          lessonId: "lesson-code-1",
          positionSeconds: 10,
        });

      expect(response.status).toBe(200);
      // Enrollment query MUST query for authenticated user (testUserId), never arbitrary-victim-user-999
      expect(enrollmentSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: testUserId }));
      expect(enrollmentSpy).not.toHaveBeenCalledWith(expect.objectContaining({ userId: "arbitrary-victim-user-999" }));
    });

    test("2. unrelated course/lesson/block IDs are rejected with 404", async () => {
      const mockCourse = { _id: "course-101", slug: "course-101", accessLevel: "free", publicationStatus: "published", isDeleted: false };
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourse) });
      // CourseLesson query with mismatched courseId/lessonId returns null
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .patch("/api/learn/courses/course-101/progress")
        .set("Authorization", bearerToken)
        .send({
          lessonId: "unrelated-lesson-999",
          completed: true,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe("LESSON_NOT_FOUND");
    });

    test("3. generic progress update cannot directly forge coding mastery (exercisePassed:true in payload is ignored)", async () => {
      const mockCourse = { _id: "course-101", slug: "course-101", accessLevel: "free", publicationStatus: "published", isDeleted: false };
      const mockLesson = { _id: "lesson-code-1", courseId: "course-101", stableKey: "stable-1", lessonType: "coding", codingBlocks: [{ id: "b1" }], contentVersion: 1 };
      const mockEnrollment = {
        userId: testUserId,
        courseId: "course-101",
        status: "active",
        lessonProgress: [{ lessonId: "lesson-code-1", lessonStableKey: "stable-1", exercisePassed: false, completed: false }],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockLesson) });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      // Client sends forged exercisePassed: true and quizPassed: true in generic progress body
      const response = await request(app)
        .patch("/api/learn/courses/course-101/progress")
        .set("Authorization", bearerToken)
        .send({
          lessonId: "lesson-code-1",
          completed: true,
          exercisePassed: true,
          quizPassed: true,
        });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe("EXERCISE_COMPLETION_REQUIRED");
      // Lesson remains incomplete!
      expect(mockEnrollment.lessonProgress[0].completedAt).toBeUndefined();
      expect(mockEnrollment.completedLessonCount).toBeUndefined();
    });

    test("4. quizPassed cannot be forged without server quiz evaluation", async () => {
      const mockCourse = { _id: "course-101", slug: "course-101", accessLevel: "free", publicationStatus: "published", isDeleted: false };
      const mockLesson = { _id: "lesson-quiz-1", courseId: "course-101", stableKey: "stable-q-1", lessonType: "quiz", quizQuestions: [{ id: "q1" }], contentVersion: 1 };
      const mockEnrollment = {
        userId: testUserId,
        courseId: "course-101",
        status: "active",
        lessonProgress: [{ lessonId: "lesson-quiz-1", lessonStableKey: "stable-q-1", quizPassed: false, completed: false }],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockLesson) });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      const response = await request(app)
        .patch("/api/learn/courses/course-101/progress")
        .set("Authorization", bearerToken)
        .send({
          lessonId: "lesson-quiz-1",
          completed: true,
          quizPassed: true,
        });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe("QUIZ_COMPLETION_REQUIRED");
      expect(mockEnrollment.lessonProgress[0].completedAt).toBeUndefined();
    });

    test("5. solutionViewed cannot grant mastery (exercisePassed remains false and completion fails)", async () => {
      const mockCourse = { _id: "course-101", slug: "course-101", accessLevel: "free", publicationStatus: "published", isDeleted: false };
      const mockLesson = { _id: "lesson-code-1", courseId: "course-101", stableKey: "stable-1", lessonType: "coding", codingBlocks: [{ id: "b1" }], contentVersion: 1 };
      const mockEnrollment = {
        userId: testUserId,
        courseId: "course-101",
        status: "active",
        lessonProgress: [{ lessonId: "lesson-code-1", lessonStableKey: "stable-1", solutionViewed: true, exercisePassed: false, completed: false }],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockLesson) });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      const response = await request(app)
        .patch("/api/learn/courses/course-101/progress")
        .set("Authorization", bearerToken)
        .send({
          lessonId: "lesson-code-1",
          completed: true,
        });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe("EXERCISE_COMPLETION_REQUIRED");
      expect(mockEnrollment.lessonProgress[0].completedAt).toBeUndefined();
    });

    test("6. course/lesson/block relationship is strictly validated on exercise attempt", async () => {
      const mockCourse = { _id: "course-101", slug: "course-101", accessLevel: "free", publicationStatus: "published", isDeleted: false };
      const mockLesson = { _id: "lesson-code-1", courseId: "course-101", stableKey: "stable-1", lessonType: "coding", codingBlocks: [{ id: "block-valid" }], contentVersion: 1 };
      const mockEnrollment = {
        userId: testUserId,
        courseId: "course-101",
        status: "active",
        lessonProgress: [],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockLesson) });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      // Attempt with invalid block ID on lesson
      const response = await request(app)
        .post("/api/learn/courses/course-101/lessons/lesson-code-1/exercise-attempt")
        .set("Authorization", bearerToken)
        .send({
          blockId: "invalid-block-id-does-not-exist",
          passed: true,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe("CODING_BLOCK_NOT_FOUND");
    });

    test("7. Premium access is still enforced on progress updates", async () => {
      const mockCourse = { _id: "course-prem", slug: "course-prem", accessLevel: "premium", publicationStatus: "published", isDeleted: false };
      const mockLesson = { _id: "lesson-prem-1", courseId: "course-prem", stableKey: "stable-prem-1", isPreview: false, contentVersion: 1 };
      const mockEnrollment = { userId: testUserId, courseId: "course-prem", status: "active", lessonProgress: [] };

      jest.spyOn(Course, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(mockLesson) });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      // Free user has no PREMIUM_LEARN entitlement
      jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue({ plan: "free", entitlements: {} });

      const response = await request(app)
        .patch("/api/learn/courses/course-prem/progress")
        .set("Authorization", bearerToken)
        .send({
          lessonId: "lesson-prem-1",
          completed: false,
          positionSeconds: 20,
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe("PREMIUM_REQUIRED");
    });
  });
});

