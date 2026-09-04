const express = require("express");
const fs = require("fs");
const path = require("path");
const request = require("supertest");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");
const articleId = "64b000000000000000000002";
const userId = "64b000000000000000000001";

const mockArticleService = {
  getArticleById: jest.fn(),
};
const mockCommentService = {
  getComments: jest.fn(),
  createComment: jest.fn(),
};

jest.mock("../services/articleService", () => mockArticleService);
jest.mock("../services/commentService", () => mockCommentService);
jest.mock("../services/entitlementService", () => ({}));

jest.mock("../middleware/auth", () => ({
  authenticate: (req, res, next) => {
    const role = req.get("x-test-role");
    if (!role) return res.status(401).json({ message: "Authentication required." });
    req.user = {
      _id: userId,
      role,
      firstName: "Private",
      lastName: "Reader",
      username: "reader",
      email: "private@example.test",
      mobile: "+15550000000",
    };
    return next();
  },
  optionalAuthenticate: (_req, _res, next) => next(),
}));

const response = () => ({
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

describe("public Article comment privacy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockArticleService.getArticleById.mockResolvedValue({ _id: articleId, status: "published", isDeleted: false, contentType: "article" });
  });

  test("the public route is anonymous and requests only approved, non-deleted comments", async () => {
    const articleController = require("../controllers/articleController");
    mockCommentService.getComments.mockResolvedValue([]);
    const app = express();
    app.use(express.json());
    app.use("/api/articles", require("../routes/articleRoutes"));

    expect((await request(app).get(`/api/articles/${articleId}/comments`)).status).toBe(200);
    expect(mockCommentService.getComments).toHaveBeenCalledWith({ articleId, status: "approved" });
    expect(read("server", "repositories", "commentRepository.js"))
      .toContain("query.isDeleted = false");
  });

  test("pending, rejected, spam, hidden, and deleted comments cannot enter the public query", async () => {
    const articleController = require("../controllers/articleController");
    const res = response();
    mockCommentService.getComments.mockResolvedValue([]);
    await articleController.getComments({ params: { id: articleId } }, res, jest.fn());

    expect(mockCommentService.getComments).toHaveBeenCalledWith({ articleId, status: "approved" });
    expect(res.json).toHaveBeenCalledWith({ comments: [] });
  });

  test.each([
    [{ _id: articleId, status: "published", isDeleted: false, contentType: "story" }, "Story"],
    [{ _id: articleId, status: "draft", isDeleted: false, contentType: "article" }, "draft Article"],
    [{ _id: articleId, status: "published", isDeleted: true, contentType: "article" }, "deleted Article"],
  ])("a %s cannot be read or commented on through Article comment routes", async (candidate) => {
    const articleController = require("../controllers/articleController");
    mockArticleService.getArticleById.mockResolvedValue(candidate);
    const getRes = response();
    const addRes = response();

    await articleController.getComments({ params: { id: articleId } }, getRes, jest.fn());
    await articleController.addComment({ params: { id: articleId }, body: { body: "Private thought" }, user: { _id: userId } }, addRes, jest.fn());

    expect(getRes.status).toHaveBeenCalledWith(404);
    expect(addRes.status).toHaveBeenCalledWith(404);
    expect(mockCommentService.getComments).not.toHaveBeenCalled();
    expect(mockCommentService.createComment).not.toHaveBeenCalled();
  });

  test("the public DTO never serializes private account fields or identifiers", () => {
    const { serializePublicComment } = require("../serializers/commentSerializer");
    const serialized = serializePublicComment({
      _id: "comment-private-id",
      articleId,
      authorName: "Fallback",
      body: "A public thought.",
      status: "approved",
      moderationNotes: "private note",
      authorId: {
        _id: userId,
        firstName: "Public",
        lastName: "Name",
        username: "public-name",
        email: "private@example.test",
        mobile: "+15550000000",
        role: "Admin",
        profile: { avatar: "/uploads/avatar.jpg", bio: "private bio" },
      },
      createdAt: "2026-09-03T00:00:00.000Z",
    });

    expect(serialized).toEqual({
      body: "A public thought.",
      createdAt: "2026-09-03T00:00:00.000Z",
      author: {
        displayName: "Public Name",
      },
    });
    expect(JSON.stringify(serialized)).not.toMatch(/private@example|15550000000|Admin|comment-private-id|private note|private bio/);
  });

  test("a reader submission returns only an explicit pending-approval result", async () => {
    const articleController = require("../controllers/articleController");
    mockCommentService.createComment.mockResolvedValue({
      _id: "pending-id",
      body: "Pending body",
      status: "pending",
      authorId: { email: "private@example.test" },
    });
    const req = {
      params: { id: articleId },
      body: { body: "Pending body" },
      user: { _id: userId, firstName: "Private", lastName: "Reader", username: "reader" },
    };
    const res = response();

    await articleController.addComment(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: "pending",
      message: "Comment submitted for moderation.",
    });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain("Pending body");
  });
});

describe("comment moderation boundary", () => {
  let app;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../middleware/auth", () => ({
      authenticate: (req, res, next) => {
        const role = req.get("x-test-role");
        if (!role) return res.status(401).json({ message: "Authentication required." });
        req.user = { _id: userId, role };
        return next();
      },
    }));
    jest.doMock("../controllers/commentController", () => ({
      getComments: (_req, res) => res.json({ comments: [] }),
      updateComment: (_req, res) => res.json({ success: true }),
      restoreComment: (_req, res) => res.json({ success: true }),
      deleteComment: (_req, res) => res.json({ success: true }),
    }));
    app = express();
    app.use(express.json());
    app.use("/api/comments", require("../routes/commentRoutes"));
  });

  test("anonymous and non-Admin users cannot use moderation endpoints", async () => {
    expect((await request(app).put(`/api/comments/${articleId}`).send({ status: "approved" })).status).toBe(401);
    expect((await request(app).put(`/api/comments/${articleId}`).set("x-test-role", "Reader").send({ status: "approved" })).status).toBe(403);
    expect((await request(app).put(`/api/comments/${articleId}`).set("x-test-role", "Editor").send({ status: "approved" })).status).toBe(403);
  });

  test("invalid statuses and arbitrary update fields are rejected", async () => {
    const invalidStatus = await request(app)
      .put(`/api/comments/${articleId}`)
      .set("x-test-role", "Admin")
      .send({ status: "published" });
    const arbitraryField = await request(app)
      .put(`/api/comments/${articleId}`)
      .set("x-test-role", "Admin")
      .send({ status: "approved", authorId: "attacker" });

    expect(invalidStatus.status).toBe(422);
    expect(arbitraryField.status).toBe(422);
  });

  test("valid Admin moderation remains available", async () => {
    expect((await request(app)
      .put(`/api/comments/${articleId}`)
      .set("x-test-role", "Admin")
      .send({ status: "approved", isPinned: true })).status).toBe(200);
  });

  test("the service rejects a disallowed status transition before updating MongoDB", async () => {
    const repository = jest.requireActual("../repositories/commentRepository");
    const activityLogs = jest.requireActual("../repositories/activityLogRepository");
    const service = jest.requireActual("../services/commentService");
    jest.spyOn(repository, "findById").mockResolvedValue({ _id: articleId, status: "approved", isDeleted: false });
    const update = jest.spyOn(repository, "update").mockResolvedValue({ _id: articleId, status: "pending" });
    jest.spyOn(activityLogs, "create").mockResolvedValue({});

    await expect(service.updateComment(articleId, { status: "pending" }, userId))
      .rejects.toMatchObject({ status: 422, message: "Invalid comment status transition." });
    expect(update).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  test("the repository runs Mongoose validators for moderation updates", () => {
    const repository = read("server", "repositories", "commentRepository.js");
    expect(repository).toContain("{ new: true, runValidators: true }");
    expect(repository).not.toContain('username email"');
  });
});

describe("protected CMS browser-state contracts", () => {
  const contextFiles = [
    "ContentCmsContext.js",
    "AccessCmsContext.js",
    "EngagementCmsContext.js",
    "SiteCmsContext.js",
    "MediaCmsContext.js",
  ];

  test.each(contextFiles)("%s never writes protected records to localStorage", (file) => {
    const source = read("src", "context", file);
    expect(source).not.toContain("localStorage.setItem");
    expect(source).not.toContain("sessionStorage");
    expect(source).toContain("localStorage.removeItem(STORAGE_KEY)");
  });

  test.each(contextFiles)("%s is Admin-only and identity-gates exposed state", (file) => {
    const source = read("src", "context", file);
    expect(source).toContain('user?.role === "Admin"');
    expect(source).toMatch(/dataOwnerId === activeAdminId|dataScope === activeScope/);
    expect(source).toContain("requestVersionRef.current += 1");
    expect(source).toMatch(/CMS_STALE_(?:ADMIN|CONTENT)_RESPONSE/);
  });

  test("Content CMS ignores an in-flight Admin response after logout, role change, or account switch", () => {
    const source = read("src", "context", "ContentCmsContext.js");
    expect(source).toContain("activeScopeRef.current !== scope");
    expect(source).toContain("ownsContentState ? articles : []");
    expect(source).not.toContain("localStorage.getItem");
  });

  test("logout and authentication expiry clear the authoritative auth state and obsolete keys", () => {
    const auth = read("src", "context", "AuthContext.js");
    const authServiceSource = read("src", "services", "authService.js");
    const api = read("src", "services", "apiService.js");
    expect(auth).toContain('window.addEventListener("myjourney:auth-invalidated"');
    expect(auth).toContain("setUser(null)");
    expect(api).toContain('status === 401');
    for (const key of ["access", "engagement", "site", "media", "content"]) {
      expect(authServiceSource).toContain(`removeStorage("myjourney-${key}-data")`);
    }
  });

  test("ArticleDetail owns a separate public comment lifecycle", () => {
    const detail = read("src", "components", "ArticleDetail.js");
    const comments = read("src", "experiences", "shared", "widgets", "CommentsSection.js");
    expect(detail).toContain("articleApi.getComments(articleId)");
    expect(detail).not.toContain("data.comments");
    expect(detail).toContain('setCommentSubmissionStatus("pending-approval")');
    expect(comments).toContain("maxLength={1000}");
    expect(comments).toContain("disabled={comment.isSubmitting}");
    expect(comments).toContain('aria-live="polite"');
  });
});
