jest.mock("../../learn/mediaProviderService", () => ({
  capability: jest.fn(() => ({ directUploadAvailable: true })),
  createUploadSession: jest.fn(async () => ({ uploadId: "upload_1", uploadUrl: "https://upload.mux.com/test", expiresInSeconds: 3600 })),
  issuePlayback: jest.fn(async () => ({ playbackId: "signed_playback", tokens: { playback: "short_token" }, expiresInSeconds: 900 })),
}));
jest.mock("../../learn/accessPolicy", () => ({ resolveLearnAccess: jest.fn() }));

const Course = require("../../models/Course");
const CourseLesson = require("../../models/CourseLesson");
const ProtectedMediaAsset = require("../../models/ProtectedMediaAsset");
const MediaProvider = require("../../learn/mediaProviderService");
const { resolveLearnAccess } = require("../../learn/accessPolicy");
const videoService = require("../../learn/videoService");

const ids = { user: "65a000000000000000000001", creator: "65b000000000000000000001", other: "65b000000000000000000002", course: "65c000000000000000000001", lesson: "65d000000000000000000001", asset: "65e000000000000000000001" };
const query = (value) => ({ select() { return this; }, lean: async () => value, then: (resolve) => Promise.resolve(value).then(resolve) });
const uploadInput = { originalName: "lesson.mp4", mimeType: "video/mp4", sizeBytes: 100, confirmContentRights: true };

describe("Mux Course video authority", () => {
  let course;
  let lesson;
  let asset;
  beforeEach(() => {
    jest.clearAllMocks();
    course = { _id: ids.course, creatorId: ids.creator, slug: "course-a", workflowStatus: "draft", publicationStatus: "published", isDeleted: false, accessLevel: "premium", monetizationType: "PREMIUM_INCLUDED" };
    lesson = { _id: ids.lesson, courseId: ids.course, lessonType: "video", mediaAssetId: ids.asset, isDeleted: false, save: jest.fn(async function save() { return this; }) };
    asset = { _id: ids.asset, id: ids.asset, creatorId: ids.creator, courseId: ids.course, lessonId: ids.lesson, provider: "mux", mediaKind: "video", deliveryStatus: "pending", status: "draft", muxPlaybackId: "", providerAssetId: "", readyAt: null, save: jest.fn(async function save() { return this; }) };
    jest.spyOn(Course, "findOne").mockImplementation((filter) => query(filter.creatorId && String(filter.creatorId) !== ids.creator ? null : course));
    jest.spyOn(CourseLesson, "findOne").mockImplementation((filter) => query(String(filter._id) === ids.lesson ? lesson : null));
    jest.spyOn(ProtectedMediaAsset, "create").mockResolvedValue(asset);
    jest.spyOn(ProtectedMediaAsset, "findOne").mockImplementation(() => query(asset));
    resolveLearnAccess.mockResolvedValue({ allowed: true, reason: "premium" });
  });
  afterEach(() => jest.restoreAllMocks());

  test("another Creator cannot create an upload for this Course", async () => {
    await expect(videoService.initiateUpload({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.other, userId: ids.user, input: uploadInput })).rejects.toMatchObject({ status: 404 });
    expect(MediaProvider.createUploadSession).not.toHaveBeenCalled();
  });

  test("upload authorization is lesson-scoped and does not disclose provider secrets", async () => {
    const result = await videoService.initiateUpload({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, userId: ids.user, input: uploadInput });
    expect(ProtectedMediaAsset.create).toHaveBeenCalledWith(expect.objectContaining({ creatorId: ids.creator, courseId: ids.course, lessonId: ids.lesson, provider: "mux", deliveryStatus: "pending" }));
    expect(MediaProvider.createUploadSession).toHaveBeenCalledWith({ assetId: ids.asset });
    expect(result.asset.deliveryStatus).toBe("pending");
    expect(JSON.stringify(result)).not.toMatch(/tokenSecret|privateKey|webhookSecret/);
  });

  test("rejects invalid video type, size and unavailable provider before creating metadata", async () => {
    await expect(videoService.initiateUpload({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, userId: ids.user, input: { ...uploadInput, mimeType: "text/html" } })).rejects.toMatchObject({ status: 415 });
    await expect(videoService.initiateUpload({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, userId: ids.user, input: { ...uploadInput, sizeBytes: 3 * 1024 * 1024 * 1024 } })).rejects.toMatchObject({ status: 413 });
    MediaProvider.capability.mockReturnValueOnce({ directUploadAvailable: false });
    await expect(videoService.initiateUpload({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, userId: ids.user, input: uploadInput })).rejects.toMatchObject({ status: 503 });
    expect(ProtectedMediaAsset.create).not.toHaveBeenCalled();
  });

  test("provider failure leaves asset failed, never ready", async () => {
    MediaProvider.createUploadSession.mockRejectedValueOnce(new Error("Mux unavailable"));
    await expect(videoService.initiateUpload({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, userId: ids.user, input: uploadInput })).rejects.toThrow("Mux unavailable");
    expect(asset.deliveryStatus).toBe("failed");
  });

  test("browser cannot attach pending or foreign video and must provide explicit asset ID", async () => {
    await expect(videoService.attachVideo({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, assetId: undefined })).rejects.toMatchObject({ status: 422 });
    ProtectedMediaAsset.findOne.mockImplementation((filter) => query(filter.lessonId === ids.lesson && asset.deliveryStatus === "ready" ? asset : null));
    await expect(videoService.attachVideo({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, assetId: ids.asset })).rejects.toMatchObject({ status: 422 });
    expect(lesson.save).not.toHaveBeenCalled();
  });

  test("ready Mux webhook is idempotent; only signed playback IDs are accepted", async () => {
    const event = { type: "video.asset.ready", data: { id: "mux_asset", passthrough: ids.asset, playback_ids: [{ id: "signed_playback", policy: "signed" }], duration: 120 } };
    await expect(videoService.applyWebhookEvent({ ...event, data: { ...event.data, playback_ids: [{ id: "public_playback", policy: "public" }] } })).rejects.toMatchObject({ code: "MUX_SIGNED_PLAYBACK_REQUIRED" });
    await videoService.applyWebhookEvent(event);
    const firstReadyAt = asset.readyAt;
    await videoService.applyWebhookEvent(event);
    expect(asset.deliveryStatus).toBe("ready");
    expect(asset.muxPlaybackId).toBe("signed_playback");
    expect(asset.readyAt).toBe(firstReadyAt);
    await expect(videoService.applyWebhookEvent({ ...event, data: { ...event.data, id: "other_asset" } })).rejects.toMatchObject({ code: "MUX_ASSET_MISMATCH" });
  });

  test("ready asset can attach, detach, and detached Lesson cannot get playback", async () => {
    asset.deliveryStatus = "ready";
    asset.status = "active";
    asset.muxPlaybackId = "signed_playback";
    expect(await videoService.attachVideo({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, assetId: ids.asset })).toEqual({ attachedAssetId: ids.asset });
    expect(await videoService.attachVideo({ courseId: ids.course, lessonId: ids.lesson, creatorId: ids.creator, assetId: null })).toEqual({ attachedAssetId: null });
    await expect(videoService.playbackForLesson({ courseSlug: "course-a", lessonId: ids.lesson, userId: ids.user })).rejects.toMatchObject({ status: 404 });
  });

  test("playback verifies exact Course entitlement and readiness before signing", async () => {
    resolveLearnAccess.mockResolvedValueOnce({ allowed: false, reason: "standalone_purchase_required" });
    course.monetizationType = "STANDALONE_PAID";
    await expect(videoService.playbackForLesson({ courseSlug: "course-a", lessonId: ids.lesson, userId: ids.user })).rejects.toMatchObject({ code: "COURSE_PURCHASE_REQUIRED" });
    expect(MediaProvider.issuePlayback).not.toHaveBeenCalled();
    expect(resolveLearnAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: ids.user, courseId: ids.course, monetizationType: "STANDALONE_PAID" }));
    resolveLearnAccess.mockResolvedValue({ allowed: true, reason: "standalone_purchase" });
    await expect(videoService.playbackForLesson({ courseSlug: "course-a", lessonId: ids.lesson, userId: ids.user })).rejects.toMatchObject({ status: 503 });
    asset.deliveryStatus = "ready";
    asset.status = "active";
    asset.muxPlaybackId = "signed_playback";
    expect((await videoService.playbackForLesson({ courseSlug: "course-a", lessonId: ids.lesson, userId: ids.user })).expiresInSeconds).toBe(900);
  });

  test("deleted asset cannot be played even if a Lesson still references it", async () => {
    asset.deliveryStatus = "ready";
    asset.status = "removed";
    asset.muxPlaybackId = "signed_playback";
    ProtectedMediaAsset.findOne.mockImplementation((filter) => query(filter.status === "active" ? null : asset));
    await expect(videoService.playbackForLesson({ courseSlug: "course-a", lessonId: ids.lesson, userId: ids.user })).rejects.toMatchObject({ status: 503 });
  });

  test("unauthenticated browser cannot create uploads or attach video", async () => {
    const express = require("express");
    const request = require("supertest");
    const app = express();
    app.use(express.json());
    app.use("/api/creator-studio", require("../../routes/creatorStudioRoutes"));
    const base = `/api/creator-studio/courses/${ids.course}/lessons/${ids.lesson}`;
    expect((await request(app).post(`${base}/video-uploads`).send(uploadInput)).status).toBe(401);
    expect((await request(app).patch(`${base}/video`).send({ assetId: ids.asset, deliveryStatus: "ready" })).status).toBe(401);
    expect(MediaProvider.createUploadSession).not.toHaveBeenCalled();
  });
});
