const originalCsrf = process.env.CSRF_ENABLED;
process.env.CSRF_ENABLED = "true";
const originalMongoUri = process.env.MONGO_URI;
process.env.MONGO_URI = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/myjourney_v1_story_test";

const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const crypto = require("crypto");
const env = require("../config/env");
const User = require("../models/User");
const Article = require("../models/Article");
const ReaderProfile = require("../models/ReaderProfile");
const ReadingProgress = require("../models/ReadingProgress");
const { csrfProtection } = require("../middleware/security");
const ReaderProfileService = require("../services/readerProfileService");

const app = express();
app.use(express.json(), cookieParser(), csrfProtection);
app.use("/api/stories", require("../routes/storyRoutes"));
app.use("/api/articles", require("../routes/articleRoutes"));
app.use("/api/reader", require("../routes/readerRoutes"));
app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.status ? error.message : "Unavailable" }));

describe("Story library persistence and Admin discovery (real Mongo)", () => {
  const marker = `v1-story-${crypto.randomUUID()}`;
  let owner, other, admin, story, premium, draft, article;
  let userIds = [], articleIds = [];
  const token = (user) => jwt.sign({ sub: String(user._id), tokenVersion: user.tokenVersion }, env.jwtAccessSecret, { expiresIn: "5m", algorithm: "HS256" });
  const authenticated = (call, user = owner) => call.set("Authorization", `Bearer ${token(user)}`);
  const mutation = (call, user = owner) => authenticated(call, user).set("Cookie", "csrfToken=story-test-csrf").set("x-csrf-token", "story-test-csrf");
  const save = (id, saved, user = owner) => mutation(request(app).put(`/api/stories/${id}/save`), user).send({ saved });

  beforeAll(async () => {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/myjourney_v1_story_test";
    if (!/(?:^|_)(?:test|e2e)$/i.test(new URL(uri).pathname.slice(1))) throw new Error("Story integration requires an isolated test database.");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    await Promise.all([User.init(), Article.init(), ReaderProfile.init()]);
    for (const [index, role] of ["Reader", "Reader", "Admin"].entries()) {
      const user = await User.create({ firstName: "Story", lastName: "Test", username: `${marker}-${index}`, email: `${marker}-${index}@example.test`, mobile: `+1${String(BigInt(`0x${crypto.randomBytes(5).toString("hex")}`)).padStart(12, "0")}`, passwordHash: "!unusable-test-hash", role, status: "ACTIVE" });
      userIds.push(user._id);
    }
    [owner, other, admin] = await Promise.all(userIds.map((id) => User.findById(id)));
    for (const [index, data] of [
      { contentType: "story", status: "published" },
      { contentType: "story", status: "published", accessLevel: "premium" },
      { contentType: "story", status: "draft" },
      { contentType: "article", status: "published" },
    ].entries()) {
      const item = await Article.create({ title: `${marker} ${index}`, slug: `${marker}-${index}`, body: "<p>Private full body must never appear in library metadata.</p>", category: data.contentType === "story" ? "Stories" : "Life", ...data });
      articleIds.push(item._id);
    }
    [story, premium, draft, article] = await Promise.all(articleIds.map((id) => Article.findById(id)));
  }, 30000);

  afterAll(async () => {
    await Promise.all([
      ReaderProfile.deleteMany({ userId: { $in: userIds } }),
      ReadingProgress.deleteMany({ userId: { $in: userIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
      Article.deleteMany({ _id: { $in: articleIds } }),
    ]);
    await mongoose.disconnect();
    if (originalCsrf === undefined) delete process.env.CSRF_ENABLED;
    else process.env.CSRF_ENABLED = originalCsrf;
    if (originalMongoUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = originalMongoUri;
  }, 30000);

  test("requires a session and CSRF; rejects caller ownership and invalid state", async () => {
    expect((await request(app).put(`/api/stories/${story.id}/save`).set("Cookie", "csrfToken=story-test-csrf").set("x-csrf-token", "story-test-csrf").send({ saved: true })).status).toBe(401);
    expect((await authenticated(request(app).put(`/api/stories/${story.id}/save`)).send({ saved: true })).status).toBe(403);
    expect((await mutation(request(app).put(`/api/stories/${story.id}/save`)).send({ saved: true, userId: other.id })).status).toBe(422);
    expect((await save(story.id, "true")).status).toBe(422);
    expect((await save("bad-id", true)).status).toBe(422);
  });

  test("repeated and concurrent saves persist exactly one Story without Article progress", async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => save(story.id, true)));
    results.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ storyId: story.id, isActive: true, libraryItem: { id: story.id, contentType: "story" } });
      expect(response.body.libraryItem).not.toHaveProperty("body");
      expect(response.headers["cache-control"]).toBe("private, no-store");
    });
    const stored = await ReaderProfile.findOne({ userId: owner._id }).lean();
    expect(stored.savedStories.map(String)).toEqual([story.id]);
    expect(stored.savedArticles).toEqual([]);
    expect(await ReadingProgress.countDocuments({ userId: owner._id })).toBe(0);
    const reloaded = await authenticated(request(app).get("/api/reader/profile"));
    expect(reloaded.body.data.library.savedStories.map((item) => item.id)).toEqual([story.id]);
    expect(reloaded.body.data.library.saved).toEqual([]);
    expect((await authenticated(request(app).get("/api/reader/profile"), other)).body.data.library.savedStories).toEqual([]);
  });

  test("removal is idempotent and does not affect another account", async () => {
    await save(story.id, true, other);
    expect((await save(story.id, false)).body.isActive).toBe(false);
    expect((await save(story.id, false)).body.isActive).toBe(false);
    expect((await ReaderProfileService.getProfileContract(owner)).library.savedStories).toEqual([]);
    expect((await ReaderProfileService.getProfileContract(other)).library.savedStories.map((item) => item.id)).toEqual([story.id]);
  });

  test("rejects drafts, deleted content and Article-route mixing; Premium save reveals metadata only", async () => {
    expect((await save(draft.id, true)).status).toBe(404);
    expect((await save(article.id, true)).status).toBe(404);
    expect((await mutation(request(app).post(`/api/articles/${story.id}/save`)).send({})).status).toBe(404);
    const result = await save(premium.id, true);
    expect(result.status).toBe(200);
    expect(JSON.stringify(result.body)).not.toContain("Private full body");
    await Article.updateOne({ _id: premium._id }, { $set: { isDeleted: true } });
    expect((await save(premium.id, true)).status).toBe(404);
    expect((await ReaderProfileService.getProfileContract(owner)).library.savedStories).toEqual([]);
  });

  test("Admin Story library includes drafts without exposing them to Readers", async () => {
    expect((await request(app).get("/api/stories/admin/all")).status).toBe(401);
    expect((await authenticated(request(app).get("/api/stories/admin/all"))).status).toBe(403);
    const response = await authenticated(request(app).get(`/api/stories/admin/all?ids=${draft.id},${article.id}&contentType=article`), admin);
    expect(response.status).toBe(200);
    expect(response.body.articles.map((item) => item._id)).toEqual([draft.id]);
    expect(response.body.articles[0].body).toContain("Private full body");
    const publicList = await request(app).get(`/api/stories?ids=${draft.id},${story.id}&limit=9999&status=draft`);
    expect(publicList.body.pagination.limit).toBe(48);
    expect(publicList.body.articles.map((item) => item._id)).toEqual([story.id]);
    expect(publicList.body.articles[0]).not.toHaveProperty("body");
  });
});
