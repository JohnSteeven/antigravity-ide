jest.mock("../../learn/storageService", () => ({
  provider: jest.fn(() => "local_development"),
  newKey: jest.fn((creatorId) => `resources/${creatorId}/00000000-0000-4000-8000-000000000001`),
  put: jest.fn(async ({ buffer }) => ({ sizeBytes: buffer.length, checksum: "checked" })),
  head: jest.fn(async (asset) => ({ sizeBytes: asset.sizeBytes, mimeType: asset.mimeType })),
  read: jest.fn(async () => require("stream").Readable.from(Buffer.from("%PDF-1.4"))),
  remove: jest.fn(),
}));
jest.mock("../../learn/accessPolicy", () => ({ resolveLearnAccess: jest.fn() }));

const Course = require("../../models/Course");
const LearningResource = require("../../models/LearningResource");
const ProtectedMediaAsset = require("../../models/ProtectedMediaAsset");
const storage = require("../../learn/storageService");
const { resolveLearnAccess } = require("../../learn/accessPolicy");
const resourceStorage = require("../../learn/resourceStorageService");

const ids = {
  creator: "65b000000000000000000001", other: "65b000000000000000000002",
  user: "65a000000000000000000001", course: "65c000000000000000000001",
  resource: "65d000000000000000000001", asset: "65e000000000000000000001",
};
const file = () => ({ originalname: "lesson.pdf", mimetype: "application/pdf", size: 8, buffer: Buffer.from("%PDF-1.4") });
const query = (value) => ({ select() { return this; }, lean: async () => value });

describe("private Course resource storage", () => {
  let course;
  let asset;
  let resource;
  beforeEach(() => {
    jest.clearAllMocks();
    course = { _id: ids.course, creatorId: ids.creator, accessLevel: "free", monetizationType: "FREE", publicationStatus: "published", isDeleted: false };
    asset = { _id: ids.asset, id: ids.asset, creatorId: ids.creator, courseId: ids.course, status: "draft", provider: "local_development", storageKey: storage.newKey(ids.creator), originalName: "lesson.pdf", mimeType: "application/pdf", sizeBytes: 8, deliveryStatus: "pending", save: jest.fn(async function save() { return this; }) };
    resource = { _id: ids.resource, slug: "lesson-resource", creatorId: ids.creator, courseId: ids.course, assetId: ids.asset, accessLevel: "free", publicationStatus: "published" };
    jest.spyOn(Course, "findOne").mockImplementation((filter) => query(String(filter._id) === ids.course && (!filter.creatorId || String(filter.creatorId) === ids.creator) ? course : null));
    jest.spyOn(ProtectedMediaAsset, "findOne").mockResolvedValue(null);
    jest.spyOn(ProtectedMediaAsset, "create").mockResolvedValue(asset);
    jest.spyOn(LearningResource, "findOne").mockImplementation(() => query(resource));
    resolveLearnAccess.mockResolvedValue({ allowed: true, reason: "free" });
  });
  afterEach(() => jest.restoreAllMocks());

  test("rejects a Creator uploading to another Creator's Course", async () => {
    await expect(resourceStorage.uploadResource({ creatorId: ids.other, userId: ids.user, courseId: ids.course, file: file() })).rejects.toMatchObject({ status: 404 });
    expect(storage.put).not.toHaveBeenCalled();
  });

  test("rejects unsupported MIME and oversized files before storage", async () => {
    await expect(resourceStorage.uploadResource({ creatorId: ids.creator, userId: ids.user, courseId: ids.course, file: { ...file(), mimetype: "text/html" } })).rejects.toMatchObject({ status: 415 });
    await expect(resourceStorage.uploadResource({ creatorId: ids.creator, userId: ids.user, courseId: ids.course, file: { ...file(), size: 51 * 1024 * 1024 } })).rejects.toMatchObject({ status: 415 });
    expect(storage.put).not.toHaveBeenCalled();
  });

  test("uses a server-generated key and stores metadata only after authorized upload", async () => {
    const result = await resourceStorage.uploadResource({ creatorId: ids.creator, userId: ids.user, courseId: ids.course, file: file(), idempotencyKey: "request_12345678" });
    expect(storage.newKey).toHaveBeenCalledWith(ids.creator);
    expect(ProtectedMediaAsset.create).toHaveBeenCalledWith(expect.objectContaining({ storageKey: storage.newKey(ids.creator), uploadedBy: ids.user, courseId: ids.course }));
    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(result.deliveryStatus).toBe("ready");
  });

  test("idempotent retry returns the ready asset without writing again", async () => {
    asset.deliveryStatus = "ready";
    ProtectedMediaAsset.findOne.mockResolvedValue(asset);
    await resourceStorage.uploadResource({ creatorId: ids.creator, userId: ids.user, courseId: ids.course, file: file(), idempotencyKey: "request_12345678" });
    expect(storage.put).not.toHaveBeenCalled();
  });

  test("denies private download when exact Course access fails", async () => {
    resolveLearnAccess.mockResolvedValue({ allowed: false, reason: "standalone_purchase_required" });
    course.monetizationType = "STANDALONE_PAID";
    await expect(resourceStorage.getDownload({ slug: resource.slug, userId: ids.user })).rejects.toMatchObject({ status: 403, code: "COURSE_PURCHASE_REQUIRED" });
    expect(resolveLearnAccess).toHaveBeenCalledWith(expect.objectContaining({ courseId: ids.course, monetizationType: "STANDALONE_PAID" }));
    expect(storage.read).not.toHaveBeenCalled();
  });

  test("requires published relation and a ready matching asset", async () => {
    resource.publicationStatus = "draft";
    await expect(resourceStorage.getDownload({ slug: resource.slug, userId: ids.user })).rejects.toMatchObject({ status: 404 });
    resource.publicationStatus = "published";
    jest.spyOn(ProtectedMediaAsset, "findOne").mockImplementation(() => query({ ...asset, deliveryStatus: "ready", courseId: ids.other }));
    await expect(resourceStorage.getDownload({ slug: resource.slug, userId: ids.user })).rejects.toMatchObject({ status: 503 });
  });

  test("provider failure records failed metadata and never claims ready", async () => {
    storage.put.mockRejectedValueOnce(new Error("provider down"));
    await expect(resourceStorage.uploadResource({ creatorId: ids.creator, userId: ids.user, courseId: ids.course, file: file() })).rejects.toThrow("provider down");
    expect(asset.deliveryStatus).toBe("failed");
  });

  test("cross-Creator asset removal is denied and linked objects are retained", async () => {
    ProtectedMediaAsset.findOne.mockImplementation((filter) => ({ select: async () => String(filter.creatorId) === ids.creator ? asset : null }));
    await expect(resourceStorage.deleteUnlinkedAsset({ assetId: ids.asset, creatorId: ids.other })).rejects.toMatchObject({ status: 404 });
    jest.spyOn(LearningResource, "exists").mockResolvedValue({ _id: ids.resource });
    await expect(resourceStorage.deleteUnlinkedAsset({ assetId: ids.asset, creatorId: ids.creator })).rejects.toMatchObject({ status: 409, code: "ASSET_IN_USE" });
    expect(storage.remove).not.toHaveBeenCalled();
  });

  test("provider delete failure does not mark object removed", async () => {
    asset.deliveryStatus = "ready";
    ProtectedMediaAsset.findOne.mockImplementation(() => ({ select: async () => asset }));
    jest.spyOn(LearningResource, "exists").mockResolvedValue(null);
    storage.remove.mockRejectedValueOnce(new Error("R2 unavailable"));
    await expect(resourceStorage.deleteUnlinkedAsset({ assetId: ids.asset, creatorId: ids.creator })).rejects.toThrow("R2 unavailable");
    expect(asset.status).not.toBe("removed");
  });

  test("unauthenticated upload route rejects before Course lookup", async () => {
    const express = require("express");
    const request = require("supertest");
    const app = express();
    app.use("/api/creator-studio", require("../../routes/creatorStudioRoutes"));
    const response = await request(app).post(`/api/creator-studio/courses/${ids.course}/resources/upload`).attach("file", Buffer.from("%PDF-1.4"), "lesson.pdf");
    expect(response.status).toBe(401);
    expect(Course.findOne).not.toHaveBeenCalled();
  });
});
