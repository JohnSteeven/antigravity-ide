const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const env = require("../../config/env");
const learnRoutes = require("../../routes/learnRoutes");
const User = require("../../models/User");
const Course = require("../../models/Course");
const CourseModule = require("../../models/CourseModule");
const CourseLesson = require("../../models/CourseLesson");

describe("Pre-Commit Audit Verification Suite: All Fields Persistence & React Runtime Rejection", () => {
  let app;
  const adminUserId = new mongoose.Types.ObjectId().toString();
  let adminToken;

  const testCourseId = new mongoose.Types.ObjectId().toString();
  const testModuleId = new mongoose.Types.ObjectId().toString();
  const testLessonId = new mongoose.Types.ObjectId().toString();

  beforeAll(() => {
    const secret = env.jwtAccessSecret || "access-secret";
    adminToken = "Bearer " + jwt.sign({ sub: adminUserId, tokenVersion: 0 }, secret, { expiresIn: "1h" });

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/learn", learnRoutes);
    app.use((err, req, res, _next) => {
      res.status(err.status || 500).json({ code: err.code || "INTERNAL_ERROR", message: err.message });
    });
  });

  beforeEach(() => {
    jest.spyOn(User, "findById").mockImplementation((id) => {
      if (String(id) === String(adminUserId)) {
        return Promise.resolve({
          _id: adminUserId,
          role: "Admin",
          status: "ACTIVE",
          tokenVersion: 0,
          isDeleted: false,
        });
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Item 3: All 14 Lesson Fields Round-Trip Persistence", () => {
    test("GET /api/learn/admin/coding/lessons/:lessonId returns all 14 authored fields without exclusion", async () => {
      const comprehensiveLesson = {
        _id: testLessonId,
        courseId: testCourseId,
        moduleId: testModuleId,
        title: "Mastering Flexbox Alignment",
        description: "Deep dive into justify-content and align-items.",
        lessonType: "coding",
        durationSeconds: 900,
        completionMode: "manual",
        isPreview: true,
        body: "# Flexbox Deep Dive\n\nLearn how items align across the cross axis.",
        codingBlocks: [
          {
            blockType: "exercise",
            title: "Center the Hero Box",
            language: "css",
            instructions: "Use flexbox to align items center.",
            content: "Detailed worked example demonstrating align-items: center in production.",
            starterCode: ".container { display: flex; }",
            expectedOutput: "Items vertically centered.",
            previewFixture: "<div class='container'><div class='box'></div></div>",
            hints: [
              "Remember align-items works on the cross axis.",
              "Set align-items: center on .container."
            ],
            solutionCode: ".container { display: flex; align-items: center; justify-content: center; }",
            validationRules: [
              {
                type: "selector_property",
                selector: ".container",
                property: "align-items",
                expected: "center",
                message: "Container should align items to center."
              }
            ],
          }
        ],
        quizQuestions: [
          {
            question: "Which CSS property defines the primary axis?",
            options: ["flex-direction", "align-items", "justify-content", "flex-wrap"],
            correctOptionIndex: 0,
            explanation: "flex-direction determines whether the main axis is row or column."
          }
        ],
        accessLevel: "premium",
        publicationStatus: "published",
        isDeleted: false,
      };

      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(comprehensiveLesson)
        })
      });

      const res = await request(app)
        .get(`/api/learn/admin/coding/lessons/${testLessonId}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const returned = res.body.data;
      expect(returned.title).toBe("Mastering Flexbox Alignment");
      expect(returned.description).toBe("Deep dive into justify-content and align-items.");
      expect(returned.durationSeconds).toBe(900);
      expect(returned.completionMode).toBe("manual");
      expect(returned.isPreview).toBe(true);
      expect(returned.body).toContain("# Flexbox Deep Dive");

      // Coding block fields
      const block = returned.codingBlocks[0];
      expect(block.blockType).toBe("exercise");
      expect(block.title).toBe("Center the Hero Box");
      expect(block.language).toBe("css");
      expect(block.instructions).toBe("Use flexbox to align items center.");
      expect(block.content).toContain("Detailed worked example demonstrating");
      expect(block.starterCode).toBe(".container { display: flex; }");
      expect(block.expectedOutput).toBe("Items vertically centered.");
      expect(block.previewFixture).toContain("<div class='box'></div>");
      expect(block.hints).toHaveLength(2);
      expect(block.solutionCode).toContain("align-items: center");
      expect(block.validationRules).toHaveLength(1);
      expect(block.validationRules[0].property).toBe("align-items");

      // Quiz fields
      expect(returned.quizQuestions).toHaveLength(1);
      expect(returned.quizQuestions[0].question).toContain("primary axis");
      expect(returned.quizQuestions[0].options).toHaveLength(4);
      expect(returned.quizQuestions[0].correctOptionIndex).toBe(0);
      expect(returned.quizQuestions[0].explanation).toContain("flex-direction");

      // Access & publishing
      expect(returned.accessLevel).toBe("premium");
      expect(returned.publicationStatus).toBe("published");
    });
  });

  describe("Item 5: Future Track (React) Authoring & Publishing Server Rejection", () => {
    test("allows authoring a React track in draft mode but strictly rejects publishing with RUNTIME_NOT_AVAILABLE", async () => {
      const reactCourse = {
        _id: testCourseId,
        slug: "react-front-end-development",
        title: "React Front-End Development",
        isSystemOwned: true,
        publicationStatus: "draft",
        contentVersion: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Course, "findOne").mockResolvedValue(reactCourse);

      // 1. Module & lesson authoring succeeds in draft mode
      jest.spyOn(CourseModule, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: testModuleId, courseId: testCourseId, title: "Module 1: Components", order: 1 }
          ])
        })
      });

      // 2. Lesson has react language block
      jest.spyOn(CourseLesson, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: testLessonId,
              title: "React JSX Components",
              codingBlocks: [
                {
                  blockType: "exercise",
                  language: "react",
                  title: "Create App Component",
                  starterCode: "export default function App() { return <h1>Hello</h1>; }"
                }
              ]
            }
          ])
        })
      });

      // 3. Attempting to publish must be rejected by server with 400 and RUNTIME_NOT_AVAILABLE
      const res = await request(app)
        .patch(`/api/learn/admin/coding/courses/${testCourseId}/publish`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RUNTIME_NOT_AVAILABLE");
      expect(res.body.message).toContain("react");
      expect(res.body.message).toContain("Use Save Draft instead");
      expect(reactCourse.publicationStatus).toBe("draft");
    });
  });
});
