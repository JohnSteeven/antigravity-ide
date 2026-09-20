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
});

