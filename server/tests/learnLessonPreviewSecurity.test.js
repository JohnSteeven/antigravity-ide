jest.mock("../config/env", () => ({ jwtAccessSecret: "lesson-preview-test-secret-only" }));

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const Course = require("../models/Course");
const CourseLesson = require("../models/CourseLesson");
const CreatorProfile = require("../models/CreatorProfile");
const User = require("../models/User");
const entitlementService = require("../services/entitlementService");
const { ENTITLEMENTS } = require("../premium/catalog");
const courseService = require("../learn/courseService");
const studioRoutes = require("../routes/creatorStudioRoutes");
const learnRoutes = require("../routes/learnRoutes");

const ids = {
  ownerUser: "65a000000000000000000001",
  otherUser: "65a000000000000000000002",
  readerUser: "65a000000000000000000003",
  suspendedUser: "65a000000000000000000004",
  ownerCreator: "65b000000000000000000001",
  otherCreator: "65b000000000000000000002",
  suspendedCreator: "65b000000000000000000003",
  course: "65c000000000000000000001",
  lesson: "65d000000000000000000001",
};
const protectedBody = "Unpublished lesson content belonging to Creator A.";
const matches = (record, filter) => Object.entries(filter).every(([key, value]) => String(record[key]) === String(value));
const bearer = (userId) => `Bearer ${jwt.sign({ sub: userId, tokenVersion: 0 }, "lesson-preview-test-secret-only", { expiresIn: "5m" })}`;
const studioUrl = `/api/creator-studio/courses/private-course/lessons/${ids.lesson}/preview`;
const publicUrl = `/api/learn/courses/private-course/lessons/${ids.lesson}`;

describe("Course lesson preview ownership", () => {
  let course;
  let lesson;
  let app;

  beforeEach(() => {
    course = {
      _id: ids.course, creatorId: ids.ownerCreator, slug: "private-course", title: "Private course",
      accessLevel: "free", publicationStatus: "draft", isDeleted: false,
    };
    lesson = {
      _id: ids.lesson, courseId: ids.course, creatorId: ids.ownerCreator, title: "Private lesson",
      body: protectedBody, transcript: "Private transcript", mediaAssetId: "private-asset",
      isPreview: false, isDeleted: false,
    };

    jest.spyOn(Course, "findOne").mockImplementation((filter) => ({
      lean: async () => matches(course, filter) ? { ...course } : null,
    }));
    jest.spyOn(CourseLesson, "findOne").mockImplementation((filter) => ({
      select() { return this; },
      lean: async () => matches(lesson, filter) ? { ...lesson } : null,
    }));
    jest.spyOn(User, "findById").mockImplementation(async (id) => Object.values(ids).includes(id)
      ? { _id: id, status: "ACTIVE", role: "Reader", tokenVersion: 0, isDeleted: false }
      : null);
    jest.spyOn(CreatorProfile, "findOne").mockImplementation(({ userId }) => ({ lean: async () => {
      if (userId === ids.ownerUser) return { _id: ids.ownerCreator, userId, status: "active" };
      if (userId === ids.otherUser) return { _id: ids.otherCreator, userId, status: "active" };
      if (userId === ids.suspendedUser) return { _id: ids.suspendedCreator, userId, status: "suspended" };
      return null;
    } }));
    jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue({ plan: "free", entitlements: {} });

    app = express();
    app.use(express.json(), cookieParser());
    app.use("/api/creator-studio", studioRoutes);
    app.use("/api/learn", learnRoutes);
    app.use((error, _req, res, _next) => res.status(error.status || 500).json({ code: error.code, message: error.message }));
  });

  afterEach(() => jest.restoreAllMocks());

  test.each([
    ["free", false],
    ["free", true],
    ["premium", false],
    ["premium", true],
  ])("another Creator cannot preview a %s draft (preview flag %s), even with Premium", async (accessLevel, isPreview) => {
    course.accessLevel = accessLevel;
    lesson.isPreview = isPreview;
    entitlementService.resolveForUser.mockResolvedValue({ plan: "premium", entitlements: { [ENTITLEMENTS.PREMIUM_LEARN]: true } });

    await expect(courseService.getLesson({
      courseSlug: course.slug, lessonId: ids.lesson, userId: ids.otherUser, creatorId: ids.otherCreator,
    })).rejects.toMatchObject({ status: 404, code: "COURSE_NOT_FOUND" });
    expect(CourseLesson.findOne).not.toHaveBeenCalled();
    expect(entitlementService.resolveForUser).not.toHaveBeenCalled();
  });

  test("the owner can preview their unpublished Premium lesson without a subscription", async () => {
    course.accessLevel = "premium";
    await expect(courseService.getLesson({
      courseSlug: course.slug, lessonId: ids.lesson, userId: ids.ownerUser, creatorId: ids.ownerCreator,
    })).resolves.toMatchObject({ lesson: { body: protectedBody, locked: false }, accessReason: "owner_preview" });
    expect(entitlementService.resolveForUser).not.toHaveBeenCalled();
  });

  test("an explicitly authorized Admin service call retains draft review access", async () => {
    course.accessLevel = "premium";
    await expect(courseService.getLesson({ courseSlug: course.slug, lessonId: ids.lesson, admin: true }))
      .resolves.toMatchObject({ lesson: { body: protectedBody }, accessReason: "admin" });
  });

  test("deleted courses and mismatched lesson/course identities cannot be previewed", async () => {
    course.isDeleted = true;
    await expect(courseService.getLesson({ courseSlug: course.slug, lessonId: ids.lesson, creatorId: ids.ownerCreator }))
      .rejects.toMatchObject({ status: 404, code: "COURSE_NOT_FOUND" });
    course.isDeleted = false;
    lesson.courseId = "another-course";
    await expect(courseService.getLesson({ courseSlug: course.slug, lessonId: ids.lesson, creatorId: ids.ownerCreator }))
      .rejects.toMatchObject({ status: 404, code: "LESSON_NOT_FOUND" });
  });

  test("Studio HTTP preview rejects anonymous, non-Creator, and suspended-Creator requests", async () => {
    await request(app).get(studioUrl).expect(401);
    await request(app).get(studioUrl).set("Authorization", bearer(ids.readerUser)).expect(403);
    await request(app).get(studioUrl).set("Authorization", bearer(ids.suspendedUser)).expect(403);
    expect(Course.findOne).not.toHaveBeenCalled();
  });

  test.each(["draft", "published"])("Studio HTTP preview denies another Creator's %s course and ignores spoofed ownership/Admin inputs", async (publicationStatus) => {
    course.publicationStatus = publicationStatus;
    lesson.isPreview = true;
    const response = await request(app).get(studioUrl)
      .query({ creatorId: ids.ownerCreator, userId: ids.ownerUser, admin: "true" })
      .set("Authorization", bearer(ids.otherUser))
      .expect(404);
    expect(response.body.code).toBe("COURSE_NOT_FOUND");
    expect(response.text).not.toContain(protectedBody);
    expect(response.text).not.toContain("private-asset");
    expect(CourseLesson.findOne).not.toHaveBeenCalled();
  });

  test("Studio HTTP preview returns the owner's lesson with private cache policy", async () => {
    const response = await request(app).get(studioUrl).set("Authorization", bearer(ids.ownerUser)).expect(200);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.body.data.lesson.body).toBe(protectedBody);
  });

  test("public HTTP lesson access cannot use creatorId/Admin query inputs to view a draft preview", async () => {
    lesson.isPreview = true;
    const response = await request(app).get(publicUrl)
      .query({ creatorId: ids.ownerCreator, admin: "true" })
      .set("Authorization", bearer(ids.ownerUser)).expect(404);
    expect(response.text).not.toContain(protectedBody);
  });

  test("published free lessons and Premium previews remain public, while full Premium lessons stay gated", async () => {
    course.publicationStatus = "published";
    let response = await request(app).get(publicUrl).expect(200);
    expect(response.body.data.lesson.body).toBe(protectedBody);
    course.accessLevel = "premium";
    response = await request(app).get(publicUrl).expect(403);
    expect(response.body.code).toBe("PREMIUM_REQUIRED");
    expect(response.text).not.toContain(protectedBody);
    lesson.isPreview = true;
    response = await request(app).get(publicUrl).expect(200);
    expect(response.body.data.lesson.body).toBe(protectedBody);
  });
});
