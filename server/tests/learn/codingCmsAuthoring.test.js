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
const courseService = require("../../learn/courseService");

describe("Coding CMS Authoring Platform Test Suite", () => {
  let app;
  const adminUserId = new mongoose.Types.ObjectId().toString();
  const regularUserId = new mongoose.Types.ObjectId().toString();
  let adminToken;
  let regularToken;

  const systemCourseId = new mongoose.Types.ObjectId().toString();
  const creatorCourseId = new mongoose.Types.ObjectId().toString();
  const systemModuleId = new mongoose.Types.ObjectId().toString();
  const systemLessonId = new mongoose.Types.ObjectId().toString();

  beforeAll(() => {
    const secret = env.jwtAccessSecret || "access-secret";
    adminToken = "Bearer " + jwt.sign({ sub: adminUserId, tokenVersion: 0 }, secret, { expiresIn: "1h" });
    regularToken = "Bearer " + jwt.sign({ sub: regularUserId, tokenVersion: 0 }, secret, { expiresIn: "1h" });

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
      return Promise.resolve({
        _id: regularUserId,
        role: "User",
        status: "ACTIVE",
        tokenVersion: 0,
        isDeleted: false,
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("1. Validation Rule Schema Whitelist (Amendment #9)", () => {
    test("sanitizes valid rule types and strips unknown fields or unsupported types", () => {
      const dirtyRules = [
        { type: "element_exists", selector: "h1", malformedEvilCode: "eval('malicious')" },
        { type: "invalid_unsupported_type", selector: "p" },
        { type: "stdout_contains", expected: "Hello World" },
        "not-even-an-object",
        null,
      ];

      const cleaned = courseService.sanitizeValidationRules(dirtyRules);
      expect(cleaned).toHaveLength(2);
      expect(cleaned[0]).toEqual({
        type: "element_exists",
        selector: "h1",
      });
      expect(cleaned[0].malformedEvilCode).toBeUndefined();
      expect(cleaned[1]).toEqual({
        type: "stdout_contains",
        expected: "Hello World",
      });
    });
  });

  describe("2. System Ownership Verification on Module Operations", () => {
    test("rejects module creation for creator-owned non-system courses with 403", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: creatorCourseId,
          slug: "creator-ruby-course",
          isSystemOwned: false,
          isDeleted: false,
        }),
      });

      const res = await request(app)
        .post(`/api/learn/admin/coding/courses/${creatorCourseId}/modules`)
        .set("Authorization", adminToken)
        .send({ title: "Module 1" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("NOT_SYSTEM_COURSE");
    });

    test("allows admin to create a module on a system-owned track", async () => {
      const mockCourse = {
        _id: systemCourseId,
        slug: "html-foundations",
        creatorId: "creator-system-01",
        isSystemOwned: true,
        structuralVersion: 1,
        isDeleted: false,
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });
      jest.spyOn(CourseModule, "findOne").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({ order: 0 }),
          }),
        }),
      });
      jest.spyOn(CourseModule, "create").mockResolvedValue({
        _id: systemModuleId,
        stableKey: "module-html-foundations-01",
        title: "Semantic HTML Elements",
        description: "Overview of semantic tags",
        order: 1,
      });
      jest.spyOn(CourseModule, "countDocuments").mockResolvedValue(2);
      jest.spyOn(Course, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .post(`/api/learn/admin/coding/courses/${systemCourseId}/modules`)
        .set("Authorization", adminToken)
        .send({ title: "Semantic HTML Elements", description: "Overview of semantic tags" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Semantic HTML Elements");
      expect(res.body.data.order).toBe(1);
    });

    test("soft-deletes module and preserves existing learner state (Amendment #2)", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: systemCourseId,
            slug: "html-foundations",
            isSystemOwned: true,
            structuralVersion: 1,
          }),
        }),
      });

      const mockModule = {
        _id: systemModuleId,
        isDeleted: false,
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(CourseModule, "findOne").mockResolvedValue(mockModule);
      jest.spyOn(CourseLesson, "updateMany").mockResolvedValue({ modifiedCount: 3 });
      jest.spyOn(CourseModule, "countDocuments").mockResolvedValue(1);
      jest.spyOn(CourseLesson, "countDocuments").mockResolvedValue(5);
      jest.spyOn(Course, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .delete(`/api/learn/admin/coding/courses/${systemCourseId}/modules/${systemModuleId}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockModule.isDeleted).toBe(true);
      expect(mockModule.save).toHaveBeenCalled();
    });
  });

  describe("3. Lesson Authoring Operations", () => {
    test("creates lesson in draft status for system module", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: systemCourseId,
            slug: "javascript-foundations",
            isSystemOwned: true,
            creatorId: "creator-001",
            structuralVersion: 1,
            lessonCount: 5,
          }),
        }),
      });

      jest.spyOn(CourseModule, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: systemModuleId,
          courseId: systemCourseId,
          isDeleted: false,
        }),
      });

      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({ order: 2 }),
          }),
        }),
      });

      jest.spyOn(CourseLesson, "create").mockResolvedValue({
        _id: systemLessonId,
        stableKey: "lesson-js-variables",
        title: "Variables with let and const",
        lessonType: "coding",
        order: 3,
      });

      jest.spyOn(CourseLesson, "countDocuments").mockResolvedValue(6);
      jest.spyOn(Course, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .post(`/api/learn/admin/coding/courses/${systemCourseId}/modules/${systemModuleId}/lessons`)
        .set("Authorization", adminToken)
        .send({
          title: "Variables with let and const",
          lessonType: "coding",
          isPreview: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Variables with let and const");
      expect(res.body.data.order).toBe(3);
    });

    test("soft-deletes lesson (Amendment #2)", async () => {
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: systemLessonId,
            courseId: systemCourseId,
            isDeleted: false,
          }),
        }),
      });

      jest.spyOn(Course, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: systemCourseId,
            slug: "html-foundations",
            isSystemOwned: true,
            structuralVersion: 1,
          }),
        }),
      });

      jest.spyOn(CourseLesson, "updateOne").mockResolvedValue({ modifiedCount: 1 });
      jest.spyOn(CourseLesson, "countDocuments").mockResolvedValue(4);
      jest.spyOn(Course, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .delete(`/api/learn/admin/coding/lessons/${systemLessonId}`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe("4. Runtime Validation on Track Publishing (Amendment #3)", () => {
    test("rejects publishing when course contains runnable lessons with unsupported runtime", async () => {
      jest.spyOn(Course, "findOne").mockResolvedValue({
        _id: systemCourseId,
        slug: "rust-foundations",
        isSystemOwned: true,
        isDeleted: false,
      });

      // Returns a lesson requiring Rust (which is not in html/css/javascript/python)
      jest.spyOn(CourseLesson, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              title: "Memory Safety in Rust",
              codingBlocks: [
                { language: "rust", starterCode: "fn main() {}" }
              ],
            },
          ]),
        }),
      });

      const res = await request(app)
        .patch(`/api/learn/admin/coding/courses/${systemCourseId}/publish`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RUNTIME_NOT_AVAILABLE");
      expect(res.body.message).toContain("rust");
    });

    test("allows archiving track with publicationStatus='archived' (Amendment #2)", async () => {
      const mockCourse = {
        _id: systemCourseId,
        slug: "css-foundations",
        isSystemOwned: true,
        publicationStatus: "published",
        contentVersion: 1,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Course, "findOne").mockResolvedValue(mockCourse);

      const res = await request(app)
        .patch(`/api/learn/admin/coding/courses/${systemCourseId}/archive`)
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockCourse.publicationStatus).toBe("archived");
    });
  });

  describe("5. Bulk Operations Security & Authority (Amendment #16 & #17)", () => {
    test("bulk access update rejects when any requested course is not system-owned", async () => {
      jest.spyOn(Course, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: systemCourseId }, // Only 1 found instead of 2 requested
          ]),
        }),
      });

      const res = await request(app)
        .post("/api/learn/admin/coding/bulk/access")
        .set("Authorization", adminToken)
        .send({
          courseIds: [systemCourseId, creatorCourseId],
          accessLevel: "premium",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("NOT_ALL_SYSTEM_COURSES");
    });

    test("bulk access update succeeds for valid system courses", async () => {
      jest.spyOn(Course, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: systemCourseId },
          ]),
        }),
      });
      jest.spyOn(Course, "updateMany").mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .post("/api/learn/admin/coding/bulk/access")
        .set("Authorization", adminToken)
        .send({
          courseIds: [systemCourseId],
          accessLevel: "premium",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updated).toBe(1);
      expect(res.body.data.accessLevel).toBe("premium");
    });
  });
});
