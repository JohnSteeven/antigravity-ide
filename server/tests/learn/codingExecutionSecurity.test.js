const fs = require("fs");
const path = require("path");
const { serializeLesson } = require("../../learn/serializers");
const courseService = require("../../learn/courseService");
const Course = require("../../models/Course");
const CourseEnrollment = require("../../models/CourseEnrollment");
const CourseLesson = require("../../models/CourseLesson");

describe("Phase 6: Coding Execution Security & Anti-RCE Guardrails", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Server-Side Execution Isolation Audit", () => {
    test("server/learn/ never imports or invokes child_process, exec, spawn, or eval", () => {
      const learnDir = path.resolve(__dirname, "../../learn");
      const files = fs.readdirSync(learnDir).filter((f) => f.endsWith(".js"));

      files.forEach((file) => {
        const filePath = path.join(learnDir, file);
        const content = fs.readFileSync(filePath, "utf-8");

        expect(content).not.toMatch(/require\s*\(\s*["']child_process["']\s*\)/);
        expect(content).not.toMatch(/\bexec\s*\(/);
        expect(content).not.toMatch(/\bexecSync\s*\(/);
        expect(content).not.toMatch(/\bspawn\s*\(/);
        expect(content).not.toMatch(/\bfork\s*\(/);
        expect(content).not.toMatch(/\beval\s*\(/);
        expect(content).not.toMatch(/new\s+Function\s*\(/);
      });
    });

    test("server/routes/learnRoutes.js has no command execution or shell execution logic", () => {
      const routesPath = path.resolve(__dirname, "../../routes/learnRoutes.js");
      const content = fs.readFileSync(routesPath, "utf-8");

      expect(content).not.toMatch(/child_process/);
      expect(content).not.toMatch(/\beval\s*\(/);
      expect(content).not.toMatch(/new\s+Function/);
    });
  });

  describe("Serialization Data Leak Prevention", () => {
    test("serializeLesson strips solutionCode, tests, and correctOptionIndex from learner payload", () => {
      const mockLesson = {
        _id: "lesson-123",
        title: "Protected Lesson",
        accessLevel: "free",
        lessonType: "coding",
        body: "Explanation text",
        codingBlocks: [
          {
            id: "block-1",
            blockType: "starter_code",
            title: "Task 1",
            content: "Do this",
            language: "javascript",
            starterCode: "let a = 1;",
            instructions: "Change to 2",
            expectedOutput: "2",
            hints: ["Hint 1", "Hint 2"],
            validationRules: [{ type: "output_contains", value: "2" }],
            solutionCode: "let a = 2;", // SHOULD BE STRIPPED
            tests: [{ description: "test", testCode: "assert(a===2)", hidden: true }], // SHOULD BE STRIPPED
            order: 0,
          },
        ],
        quizQuestions: [
          {
            id: "quiz-1",
            question: "What is a?",
            options: [
              { id: "opt-1", text: "One" },
              { id: "opt-2", text: "Two" },
            ],
            correctOptionIndex: 1, // SHOULD BE STRIPPED
            explanation: "Two is correct",
            order: 0,
          },
        ],
      };

      const serialized = serializeLesson(mockLesson, { allowed: true });

      expect(serialized.codingBlocks[0]).toHaveProperty("starterCode");
      expect(serialized.codingBlocks[0]).toHaveProperty("hints");
      expect(serialized.codingBlocks[0]).toHaveProperty("validationRules");
      expect(serialized.codingBlocks[0]).not.toHaveProperty("solutionCode");
      expect(serialized.codingBlocks[0]).not.toHaveProperty("tests");

      expect(serialized.quizQuestions[0]).toHaveProperty("question");
      expect(serialized.quizQuestions[0]).toHaveProperty("options");
      expect(serialized.quizQuestions[0]).not.toHaveProperty("correctOptionIndex");
    });
  });

  describe("Solution Reveal Service Integrity", () => {
    test("revealSolution requires enrollment and marks solutionViewed=true without granting exercisePassed", async () => {
      const mockCourse = {
        _id: "course-xyz",
        slug: "course-xyz",
        accessLevel: "free",
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-abc",
        courseId: "course-xyz",
        stableKey: "lesson-key-abc",
        contentVersion: 1,
        codingBlocks: [
          {
            id: "block-1",
            solutionCode: "const answer = 42;",
          },
        ],
      };

      const mockEnrollment = {
        userId: "user-1",
        courseId: "course-xyz",
        status: "active",
        lessonProgress: [],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });

      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockLesson),
        }),
      });

      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      const result = await courseService.revealSolution({
        userId: "user-1",
        courseId: "course-xyz",
        lessonId: "lesson-abc",
        blockId: "block-1",
      });

      expect(result.solutionCode).toBe("const answer = 42;");
      expect(result.solutionViewed).toBe(true);
      expect(mockEnrollment.lessonProgress).toHaveLength(1);
      expect(mockEnrollment.lessonProgress[0].solutionViewed).toBe(true);
      expect(mockEnrollment.lessonProgress[0].exercisePassed).toBe(undefined);
      expect(mockEnrollment.lessonProgress[0].completed).toBe(undefined);
      expect(mockEnrollment.save).toHaveBeenCalled();
    });

    test("revealSolution throws 403 ENROLLMENT_REQUIRED when learner is not enrolled", async () => {
      const mockCourse = {
        _id: "course-xyz",
        slug: "course-xyz",
        accessLevel: "free",
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-abc",
        courseId: "course-xyz",
        codingBlocks: [{ id: "block-1", solutionCode: "secret" }],
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });

      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockLesson),
        }),
      });

      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(null);

      await expect(
        courseService.revealSolution({
          userId: "user-unauthorized",
          courseId: "course-xyz",
          lessonId: "lesson-abc",
          blockId: "block-1",
        })
      ).rejects.toMatchObject({
        status: 403,
        code: "ENROLLMENT_REQUIRED",
      });
    });
  });

  describe("Quiz Evaluation Service Authority", () => {
    test("evaluateQuiz accurately grades submissions and records quizPassed", async () => {
      const mockCourse = {
        _id: "course-quiz",
        slug: "course-quiz",
        accessLevel: "free",
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-quiz",
        courseId: "course-quiz",
        stableKey: "lesson-key-quiz",
        contentVersion: 1,
        quizQuestions: [
          {
            id: "q1",
            correctOptionIndex: 0,
            explanation: "First option is correct",
          },
          {
            id: "q2",
            correctOptionIndex: 2,
            explanation: "Third option is correct",
          },
        ],
      };

      const mockEnrollment = {
        userId: "user-2",
        courseId: "course-quiz",
        status: "active",
        lessonProgress: [],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });

      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockLesson),
        }),
      });

      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      // Perfect score submission: q1 -> 0, q2 -> 2
      const result = await courseService.evaluateQuiz({
        userId: "user-2",
        courseId: "course-quiz",
        lessonId: "lesson-quiz",
        answers: { q1: 0, q2: 2 },
      });

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.correctCount).toBe(2);
      expect(result.totalQuestions).toBe(2);
      expect(mockEnrollment.lessonProgress[0].quizPassed).toBe(true);
      expect(mockEnrollment.lessonProgress[0].quizScore).toBe(100);
    });

    test("evaluateQuiz marks quizPassed=false when score is below 70%", async () => {
      const mockCourse = {
        _id: "course-quiz",
        slug: "course-quiz",
        accessLevel: "free",
        publicationStatus: "published",
        isDeleted: false,
      };

      const mockLesson = {
        _id: "lesson-quiz-2",
        courseId: "course-quiz",
        stableKey: "lesson-key-quiz-2",
        contentVersion: 1,
        quizQuestions: [
          { id: "q1", correctOptionIndex: 0, explanation: "Exp 1" },
          { id: "q2", correctOptionIndex: 1, explanation: "Exp 2" },
        ],
      };

      const mockEnrollment = {
        userId: "user-2",
        courseId: "course-quiz",
        status: "active",
        lessonProgress: [],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });

      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockLesson),
        }),
      });

      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(mockEnrollment);

      // 50% score: q1 -> 0 (correct), q2 -> 0 (wrong)
      const result = await courseService.evaluateQuiz({
        userId: "user-2",
        courseId: "course-quiz",
        lessonId: "lesson-quiz-2",
        answers: { q1: 0, q2: 0 },
      });

      expect(result.passed).toBe(false);
      expect(result.score).toBe(50);
      expect(result.correctCount).toBe(1);
      expect(mockEnrollment.lessonProgress[0].quizPassed).toBe(undefined);
    });
  });

  describe("Client Sandbox Security Guarantees", () => {
    test("htmlSandboxHarness enforces sandbox without allow-same-origin and sets strict CSP contract", () => {
      const harnessPath = path.resolve(__dirname, "../../../src/features/learn/sandbox/htmlSandboxHarness.js");
      const content = fs.readFileSync(harnessPath, "utf-8");

      // Verify sandbox permissions constant
      expect(content).toMatch(/SANDBOX_PERMISSIONS\s*=\s*["']allow-scripts["']/);
      expect(content).not.toMatch(/SANDBOX_PERMISSIONS.*allow-same-origin/);

      // Verify strict CSP
      // Verify strict CSP directives: scripts execute inline, network & top-navigation are completely denied
      expect(content).toMatch(/default-src 'none'/);
      expect(content).toMatch(/script-src 'unsafe-inline'/);
      expect(content).toMatch(/style-src 'unsafe-inline'/);
      expect(content).toMatch(/connect-src 'none'/);
      expect(content).toMatch(/form-action 'none'/);
      expect(content).toMatch(/object-src 'none'/);
      expect(content).toMatch(/frame-src 'none'/);
      expect(content).toMatch(/base-uri 'none'/);

      // Verify postMessage origin and source check
      expect(content).toMatch(/event\.source\s*!==\s*expectedWindow/);
      expect(content).toMatch(/expectedChannelNonce/);
    });

    test("pythonWorkerManager pins Pyodide v0.26.4 and disables network globals", () => {
      const managerPath = path.resolve(__dirname, "../../../src/features/learn/sandbox/pythonWorkerManager.js");
      const content = fs.readFileSync(managerPath, "utf-8");

      // Pinned version
      expect(content).toMatch(/PINNED_PYODIDE_VERSION\s*=\s*["']v0\.26\.4["']/);

      // Network shutdown
      expect(content).toMatch(/self\.fetch\s*=\s*undefined/);
      expect(content).toMatch(/self\.XMLHttpRequest\s*=\s*undefined/);
      expect(content).toMatch(/self\.WebSocket\s*=\s*undefined/);

      // 10s execution timeout
      expect(content).toMatch(/LEARNER_EXECUTION_TIMEOUT_MS\s*=\s*10000/);
    });
  });
});

