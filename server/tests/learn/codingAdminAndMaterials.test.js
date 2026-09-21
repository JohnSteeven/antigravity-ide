const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const learnRoutes = require("../../routes/learnRoutes");
const User = require("../../models/User");
const Course = require("../../models/Course");
const CourseModule = require("../../models/CourseModule");
const CourseLesson = require("../../models/CourseLesson");
const LearningResource = require("../../models/LearningResource");
const entitlementService = require("../../services/entitlementService");
const serializers = require("../../learn/serializers");

describe("Phase 6 Restructure: Coding Admin CMS, System Ownership & Learning Materials", () => {
  let app;
  const adminUserId = "admin-user-001";
  const regularUserId = "regular-user-002";
  let adminToken;
  let regularToken;

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
      if (id === adminUserId) {
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

  describe("1. System Ownership & Author Attribution", () => {
    test("canonical tracks are serialized with isSystemOwned: true and MyJourney Coding author", () => {
      const canonicalTrack = {
        _id: "course-html-01",
        slug: "html-foundations",
        title: "HTML Foundations",
        description: "Core HTML structure",
        accessLevel: "free",
        structuralVersion: 1,
        creatorId: {
          displayName: "Original Seed Author",
          slug: "should-be-removed",
        },
      };

      const serialized = serializers.serializeCourse(canonicalTrack);
      expect(serialized.isSystemOwned).toBe(true);
      expect(serialized.creator.displayName).toBe("MyJourney Coding");
      expect(serialized.creator.isSystem).toBe(true);
      expect(serialized.creator.slug).toBeUndefined();
    });

    test("non-canonical tracks retain creator attribution", () => {
      const creatorCourse = {
        _id: "course-creator-01",
        slug: "advanced-rust-design",
        title: "Advanced Rust Design",
        accessLevel: "premium",
        structuralVersion: 1,
        creatorId: {
          displayName: "Ferris",
          slug: "ferris-the-crab",
          profileImage: "/avatars/ferris.png",
        },
      };

      const serialized = serializers.serializeCourse(creatorCourse);
      expect(serialized.isSystemOwned).toBe(false);
      expect(serialized.creator.displayName).toBe("Ferris");
      expect(serialized.creator.slug).toBe("ferris-the-crab");
    });
  });

  describe("2. Admin Authorization for Coding CMS", () => {
    test("unauthenticated requests to /api/learn/admin/coding/courses are rejected with 401", async () => {
      const res = await request(app).get("/api/learn/admin/coding/courses");
      expect(res.status).toBe(401);
    });

    test("regular user requests to /api/learn/admin/coding/courses are rejected with 403", async () => {
      const res = await request(app)
        .get("/api/learn/admin/coding/courses")
        .set("Authorization", regularToken);
      expect(res.status).toBe(403);
    });

    test("admin can list canonical coding tracks", async () => {
      const mockCourses = [
        { _id: "c1", slug: "html-foundations", title: "HTML Foundations", accessLevel: "free", isDeleted: false },
        { _id: "c2", slug: "javascript-foundations", title: "JavaScript Foundations", accessLevel: "premium", isDeleted: false },
      ];

      jest.spyOn(Course, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCourses),
        }),
      });
      jest.spyOn(CourseModule, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      jest.spyOn(CourseLesson, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const res = await request(app)
        .get("/api/learn/admin/coding/courses")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].slug).toBe("html-foundations");
    });

    test("admin can update course accessLevel and description", async () => {
      const existingCourse = {
        _id: "c1",
        slug: "html-foundations",
        title: "HTML Foundations",
        accessLevel: "free",
        description: "Old description",
        isDeleted: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: function() { return { ...this }; },
      };

      jest.spyOn(Course, "findOne").mockResolvedValue(existingCourse);
      jest.spyOn(CourseModule, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      jest.spyOn(CourseLesson, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const res = await request(app)
        .patch("/api/learn/admin/coding/courses/html-foundations")
        .set("Authorization", adminToken)
        .send({
          accessLevel: "free",
          description: "Updated interactive developer foundations",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(existingCourse.description).toBe("Updated interactive developer foundations");
      expect(existingCourse.save).toHaveBeenCalled();
    });
  });

  describe("3. Learning Materials Management & Granular Attachment", () => {
    test("admin can create a learning material attached to a course and lesson", async () => {
      const mockCourse = { _id: "c-html", slug: "html-foundations", isDeleted: false };
      const mockLesson = { _id: "l-html-1", courseId: "c-html", isDeleted: false };

      jest.spyOn(Course, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCourse),
      });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLesson),
      });

      const createdMaterial = {
        _id: "res-001",
        title: "HTML5 Semantic Cheatsheet",
        description: "Reference guide for semantic tags",
        resourceType: "code_file",
        resourceCategory: "cheatsheet",
        courseId: "c-html",
        lessonId: "l-html-1",
        accessLevel: "free",
        isSystemOwned: true,
        filename: "html5-cheatsheet.html",
        textContent: "<!DOCTYPE html><html>...</html>",
        status: "published",
        isDeleted: false,
      };

      jest.spyOn(LearningResource, "create").mockResolvedValue(createdMaterial);

      const res = await request(app)
        .post("/api/learn/admin/coding/materials")
        .set("Authorization", adminToken)
        .send({
          title: "HTML5 Semantic Cheatsheet",
          description: "Reference guide for semantic tags",
          resourceType: "code_file",
          resourceCategory: "cheatsheet",
          courseSlug: "html-foundations",
          lessonId: "l-html-1",
          accessLevel: "free",
          filename: "html5-cheatsheet.html",
          textContent: "<!DOCTYPE html><html>...</html>",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe("HTML5 Semantic Cheatsheet");
      expect(res.body.data.resourceType).toBe("code_file");
    });

    test("admin can update an existing learning material", async () => {
      const existingMaterial = {
        _id: "res-001",
        title: "Old Title",
        accessLevel: "free",
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(LearningResource, "findById").mockResolvedValue(existingMaterial);

      const res = await request(app)
        .patch("/api/learn/admin/coding/materials/res-001")
        .set("Authorization", adminToken)
        .send({
          title: "Updated Cheatsheet Title",
          accessLevel: "premium",
        });

      expect(res.status).toBe(200);
      expect(existingMaterial.title).toBe("Updated Cheatsheet Title");
      expect(existingMaterial.accessLevel).toBe("premium");
      expect(existingMaterial.save).toHaveBeenCalled();
    });

    test("admin can soft-delete a learning material", async () => {
      const existingMaterial = {
        _id: "res-001",
        isDeleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(LearningResource, "findById").mockResolvedValue(existingMaterial);

      const res = await request(app)
        .delete("/api/learn/admin/coding/materials/res-001")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(existingMaterial.isDeleted).toBe(true);
      expect(existingMaterial.save).toHaveBeenCalled();
    });
  });

  describe("4. Learner Material Entitlement & Protected Content Masking", () => {
    const premiumMaterial = {
      _id: "res-prem-1",
      title: "Python Advanced Concurrency Guide",
      resourceType: "link",
      resourceCategory: "documentation",
      courseId: "course-py",
      accessLevel: "premium",
      externalUrl: "https://secure.myjourney.com/downloads/concurrency-guide.pdf",
      textContent: "Secret architectural patterns for threads and async",
      isDeleted: false,
      status: "published",
    };

    test("serializeResource masks externalUrl and textContent when locked for free user", () => {
      const serialized = serializers.serializeResource(premiumMaterial, { allowed: false });
      expect(serialized.locked).toBe(true);
      expect(serialized.externalUrl).toBeUndefined();
      expect(serialized.downloadUrl).toBeUndefined();
      expect(serialized.textContent).toBeUndefined();
      expect(serialized.title).toBe("Python Advanced Concurrency Guide");
    });

    test("serializeResource exposes externalUrl and textContent when unlocked for premium user", () => {
      const serialized = serializers.serializeResource(premiumMaterial, { allowed: true });
      expect(serialized.locked).toBe(false);
      expect(serialized.externalUrl).toBe("https://secure.myjourney.com/downloads/concurrency-guide.pdf");
      expect(serialized.textContent).toBe("Secret architectural patterns for threads and async");
    });

    test("learner endpoint /api/learn/coding/resources enforces entitlement dynamically", async () => {
      const mockCourse = {
        _id: "c-py",
        slug: "python-foundations",
        title: "Python Foundations",
        accessLevel: "premium",
        isDeleted: false,
      };

      jest.spyOn(Course, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCourse),
        }),
      });

      const populateMock2 = {
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { ...premiumMaterial, courseId: "c-py" },
          ]),
        }),
      };
      const populateMock1 = {
        populate: jest.fn().mockReturnValue(populateMock2),
      };

      jest.spyOn(LearningResource, "find").mockReturnValue({
        populate: jest.fn().mockReturnValue(populateMock1),
      });

      // Free user without subscription
      jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue({
        plan: "free",
        entitlements: {},
      });

      const res = await request(app)
        .get("/api/learn/coding/resources?track=python")
        .set("Authorization", regularToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      const resource = res.body.data[0];
      // Since material is premium and user is free, resource must be locked
      expect(resource.locked).toBe(true);
      expect(resource.externalUrl).toBeUndefined();
      expect(resource.textContent).toBeUndefined();
    });
  });

  describe("5. Coding Streak & Stats Calculation (Idempotent & Timezone Safe)", () => {
    it("returns default zero stats for unauthenticated visitors", async () => {
      const res = await request(app).get("/api/learn/coding/stats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStreak).toBe(0);
      expect(res.body.data.bestStreak).toBe(0);
      expect(res.body.data.weeklyGoal).toEqual({ current: 0, target: 5 });
      expect(res.body.data.exercisesPassed).toBe(0);
      expect(res.body.data.lessonsCompleted).toBe(0);
      expect(res.body.data.projectsCompleted).toBe(0);
      expect(res.body.data.achievements).toEqual([]);
    });

    it("calculates idempotent stats and streak for authenticated user", async () => {
      const CourseEnrollment = require("../../models/CourseEnrollment");
      const LearningEvent = require("../../models/LearningEvent");

      jest.spyOn(Course, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: "course-html", slug: "html-foundations", title: "HTML Foundations", lessonCount: 12 },
          ]),
        }),
      });

      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // User has 1 lesson with 2 attempts (repeated exercise passed), and 1 completed lesson
      const mockEnrollment = {
        userId: regularUserId,
        courseId: { slug: "html-foundations", title: "HTML Foundations", lessonCount: 12 },
        lessonProgress: [
          {
            lessonId: "l-html-1",
            lessonStableKey: "key-1",
            exercisePassed: true,
            completedAt: yesterday,
            lastActivityAt: yesterday,
          },
          {
            lessonId: "l-html-2",
            lessonStableKey: "key-2",
            exercisePassed: true,
            completedAt: today,
            lastActivityAt: today,
          },
        ],
      };

      jest.spyOn(CourseEnrollment, "find").mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockEnrollment]),
        }),
      });

      jest.spyOn(CourseLesson, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: "l-html-2", stableKey: "key-2", title: "HTML Project", lessonType: "project" },
          ]),
        }),
      });

      jest.spyOn(LearningEvent, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { eventType: "exercise_passed", occurredAt: yesterday, lessonId: "l-html-1" },
            { eventType: "exercise_passed", occurredAt: today, lessonId: "l-html-2" },
          ]),
        }),
      });

      const res = await request(app)
        .get("/api/learn/coding/stats?timezone=America/New_York")
        .set("Authorization", regularToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.exercisesPassed).toBe(2);
      expect(data.lessonsCompleted).toBe(2);
      expect(data.projectsCompleted).toBe(1);
      expect(data.currentStreak).toBeGreaterThanOrEqual(1);
      expect(data.bestStreak).toBeGreaterThanOrEqual(1);
      expect(data.weeklyGoal.target).toBe(5);
      expect(data.achievements.find((a) => a.id === "first_challenge").unlocked).toBe(true);
      expect(data.achievements.find((a) => a.id === "first_project").unlocked).toBe(true);
    });
  });
});
