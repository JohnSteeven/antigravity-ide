const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const env = require("../../config/env");
const learnRoutes = require("../../routes/learnRoutes");
const User = require("../../models/User");
const Course = require("../../models/Course");
const CourseLesson = require("../../models/CourseLesson");
const CourseEnrollment = require("../../models/CourseEnrollment");
const CodingSubmission = require("../../models/CodingSubmission");
const LearningEvent = require("../../models/LearningEvent");
const accessPolicy = require("../../learn/accessPolicy");

describe("Coding Submissions Architecture, Anti-Forgery & History", () => {
  let app;
  const learnerId = new mongoose.Types.ObjectId().toString();
  const strangerId = new mongoose.Types.ObjectId().toString();
  let learnerToken;
  let strangerToken;

  const mockCourseId = new mongoose.Types.ObjectId();
  const mockLessonId = new mongoose.Types.ObjectId();
  const mockBlockId = "block-1";

  const mockCourse = {
    _id: mockCourseId,
    slug: "html-foundations",
    title: "HTML Foundations",
    publicationStatus: "published",
    isDeleted: false,
    accessLevel: "free",
  };

  const mockLesson = {
    _id: mockLessonId,
    courseId: mockCourseId,
    stableKey: "lesson-stable-1",
    title: "Introduction to HTML",
    isDeleted: false,
    contentVersion: 1,
    codingBlocks: [
      {
        id: mockBlockId,
        language: "html",
        starterCode: "<p>Hello</p>",
      },
    ],
  };

  beforeAll(() => {
    const secret = env.jwtAccessSecret || "access-secret";
    learnerToken = "Bearer " + jwt.sign({ sub: learnerId, tokenVersion: 0 }, secret, { expiresIn: "1h" });
    strangerToken = "Bearer " + jwt.sign({ sub: strangerId, tokenVersion: 0 }, secret, { expiresIn: "1h" });

    app = express();
    app.use(express.json({ limit: "1mb" }));
    app.use(cookieParser());
    app.use("/api/learn", learnRoutes);
    app.use((err, req, res, _next) => {
      res.status(err.status || 500).json({ code: err.code || "INTERNAL_ERROR", message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(User, "findById").mockImplementation((id) => {
      const uId = String(id);
      return Promise.resolve({
        _id: uId,
        role: "User",
        status: "ACTIVE",
        tokenVersion: 0,
        isDeleted: false,
      });
    });

    jest.spyOn(accessPolicy, "resolveLearnAccess").mockResolvedValue({
      allowed: true,
      reason: "free",
    });

    jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(null);
    jest.spyOn(LearningEvent, "create").mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("1. Authentication & Payload Validation", () => {
    test("rejects unauthenticated submissions with 401", async () => {
      const res = await request(app)
        .post(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .send({ codeSnapshot: "<p>test</p>", status: "accepted" });

      expect(res.status).toBe(401);
    });

    test("rejects code snapshots exceeding 64 KB with 400 CODE_EXCEEDS_64KB", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockLesson) });

      const oversizedCode = "a".repeat(65537); // 64 KB + 1 byte
      const res = await request(app)
        .post(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .set("Authorization", learnerToken)
        .send({
          blockId: mockBlockId,
          codeSnapshot: oversizedCode,
          status: "accepted",
          testsPassed: 1,
          testsTotal: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("CODE_EXCEEDS_64KB");
    });

    test("rejects invalid status enum with 400 INVALID_STATUS", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockLesson) });

      const res = await request(app)
        .post(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .set("Authorization", learnerToken)
        .send({
          blockId: mockBlockId,
          codeSnapshot: "<p>test</p>",
          status: "hacked_status",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_STATUS");
    });

    test("rejects testsPassed > testsTotal with 400 INVALID_TEST_COUNTS", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockLesson) });

      const res = await request(app)
        .post(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .set("Authorization", learnerToken)
        .send({
          blockId: mockBlockId,
          codeSnapshot: "<p>test</p>",
          status: "accepted",
          testsPassed: 10,
          testsTotal: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TEST_COUNTS");
    });
  });

  describe("2. Submission Creation & Anti-Forgery Trust Boundary", () => {
    test("records browser-reported results without granting mastery to an enrolled learner", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockLesson) });
      const enrollmentSave = jest.fn().mockResolvedValue({});
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId: learnerId,
        courseId: mockCourseId,
        lessonProgress: [],
        save: enrollmentSave,
      });

      const createdDoc = {
        _id: new mongoose.Types.ObjectId(),
        userId: learnerId,
        courseId: mockCourseId,
        lessonId: mockLessonId,
        blockId: mockBlockId,
        track: "html",
        language: "html",
        codeSnapshot: "<p>Learning HTML</p>",
        status: "accepted",
        testsPassed: 3,
        testsTotal: 3,
        runtimeMs: 12,
        validationSummary: [{ description: "Has p tag", passed: true, message: "" }],
        submittedAt: new Date(),
      };
      jest.spyOn(CodingSubmission, "create").mockResolvedValue(createdDoc);
      const eventSpy = jest.spyOn(LearningEvent, "create");

      const res = await request(app)
        .post(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .set("Authorization", learnerToken)
        .send({
          blockId: mockBlockId,
          codeSnapshot: "<p>Learning HTML</p>",
          status: "accepted",
          testsPassed: 3,
          testsTotal: 3,
          runtimeMs: 12,
          validationSummary: [{ description: "Has p tag", passed: true, message: "" }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.status).toBe("accepted");
      expect(res.body.submission.testsPassed).toBe(3);
      expect(res.body.submission.exercisePassed).toBe(false);
      expect(enrollmentSave).not.toHaveBeenCalled();
      expect(eventSpy).not.toHaveBeenCalled();
    });

    test("ANTI-FORGERY: POSTing 'accepted' without enrollment does NOT grant exercise mastery", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockLesson) });
      jest.spyOn(CourseEnrollment, "findOne").mockResolvedValue(null); // Not enrolled!

      const createdDoc = {
        _id: new mongoose.Types.ObjectId(),
        userId: learnerId,
        courseId: mockCourseId,
        lessonId: mockLessonId,
        blockId: mockBlockId,
        track: "html",
        language: "html",
        codeSnapshot: "<p>Hacked</p>",
        status: "accepted",
        testsPassed: 5,
        testsTotal: 5,
        runtimeMs: 10,
        validationSummary: [],
        submittedAt: new Date(),
      };
      jest.spyOn(CodingSubmission, "create").mockResolvedValue(createdDoc);
      const eventSpy = jest.spyOn(LearningEvent, "create");

      const res = await request(app)
        .post(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .set("Authorization", learnerToken)
        .send({
          blockId: mockBlockId,
          codeSnapshot: "<p>Hacked</p>",
          status: "accepted",
          testsPassed: 5,
          testsTotal: 5,
        });

      // Submission record is saved, but mastery is false because learner is not enrolled
      expect(res.status).toBe(201);
      expect(res.body.submission.exercisePassed).toBe(false);
      expect(eventSpy).not.toHaveBeenCalled();
    });

    test("ANTI-FORGERY: POSTing 'accepted' on invalid blockId fails with 404 CODING_BLOCK_NOT_FOUND", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockLesson) });

      const res = await request(app)
        .post(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .set("Authorization", learnerToken)
        .send({
          blockId: "non-existent-block",
          codeSnapshot: "<p>test</p>",
          status: "accepted",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("CODING_BLOCK_NOT_FOUND");
    });
  });

  describe("3. Submission History & Ownership Isolation", () => {
    test("lists learner's submissions sorted by submittedAt desc", async () => {
      jest.spyOn(Course, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockCourse) });
      jest.spyOn(CourseLesson, "findOne").mockReturnValue({ lean: () => Promise.resolve(mockLesson) });

      const mockSubmissions = [
        {
          _id: new mongoose.Types.ObjectId(),
          status: "accepted",
          testsPassed: 3,
          testsTotal: 3,
          language: "html",
          runtimeMs: 15,
          submittedAt: new Date(Date.now() - 1000),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          status: "failed",
          testsPassed: 1,
          testsTotal: 3,
          language: "html",
          runtimeMs: 10,
          submittedAt: new Date(Date.now() - 5000),
        },
      ];

      const findChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSubmissions),
      };
      jest.spyOn(CodingSubmission, "find").mockReturnValue(findChain);

      const res = await request(app)
        .get(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions`)
        .set("Authorization", learnerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submissions).toHaveLength(2);
      expect(res.body.submissions[0].status).toBe("accepted");
      expect(res.body.submissions[1].status).toBe("failed");
    });

    test("stranger cannot view another user's submission details (403 FORBIDDEN)", async () => {
      const submissionId = new mongoose.Types.ObjectId();
      const mockSubmission = {
        _id: submissionId,
        userId: learnerId, // owned by learnerId
        codeSnapshot: "<p>Private code</p>",
        status: "accepted",
        testsPassed: 3,
        testsTotal: 3,
        validationSummary: [],
        submittedAt: new Date(),
      };

      jest.spyOn(CodingSubmission, "findById").mockReturnValue({ lean: () => Promise.resolve(mockSubmission) });

      // strangerId attempts to access learnerId's submission
      const res = await request(app)
        .get(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions/${submissionId}`)
        .set("Authorization", strangerToken);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    test("owner can view their submission details including codeSnapshot", async () => {
      const submissionId = new mongoose.Types.ObjectId();
      const mockSubmission = {
        _id: submissionId,
        userId: learnerId,
        codeSnapshot: "<p>Private code</p>",
        status: "accepted",
        testsPassed: 3,
        testsTotal: 3,
        language: "html",
        runtimeMs: 12,
        validationSummary: [{ description: "Valid HTML", passed: true, message: "" }],
        submittedAt: new Date(),
      };

      jest.spyOn(CodingSubmission, "findById").mockReturnValue({ lean: () => Promise.resolve(mockSubmission) });

      const res = await request(app)
        .get(`/api/learn/courses/html-foundations/lessons/${mockLessonId}/submissions/${submissionId}`)
        .set("Authorization", learnerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.codeSnapshot).toBe("<p>Private code</p>");
      expect(res.body.submission.status).toBe("accepted");
    });
  });
});
