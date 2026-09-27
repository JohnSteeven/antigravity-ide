const path = require("path");
const multer = require("multer");
const Course = require("../models/Course");
const LearningResource = require("../models/LearningResource");
const ProtectedMediaAsset = require("../models/ProtectedMediaAsset");
const { multerFileFilter, validateFileBuffer, checkMagicBytes, ALLOWED_MIME_EXT_MAP } = require("../middleware/uploadValidation");
const { resolveLearnAccess } = require("./accessPolicy");
const storage = require("./storageService");

const fail = (message, status, code) => Object.assign(new Error(message), { status, code });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: multerFileFilter });
const acceptFile = (req, res, next) => upload.single("file")(req, res, (error) => {
  if (error) return next(fail(error.message, error.code === "LIMIT_FILE_SIZE" ? 413 : (error.statusCode || 400), "RESOURCE_UPLOAD_REJECTED"));
  if (!req.file) return next(fail("A resource file is required.", 400, "RESOURCE_FILE_REQUIRED"));
  return validateFileBuffer(req, res, next);
});

const allowedMimes = new Set([
  "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip", "text/plain", "image/jpeg", "image/png", "image/webp",
]);

const uploadResource = async ({ creatorId, userId, courseId, file, idempotencyKey = "", admin = false, resourceId = null }) => {
  const course = await Course.findOne({ _id: courseId, isDeleted: false, ...(admin ? { isSystemOwned: true } : { creatorId }) }).lean();
  if (!course) throw fail("Course not found or not owned by this author.", 404, "COURSE_NOT_FOUND");
  const mimeType = String(file?.mimetype || "").toLowerCase();
  if (!allowedMimes.has(mimeType) || !file?.buffer || file.size < 1 || file.size > 50 * 1024 * 1024) throw fail("Unsupported resource file.", 415, "RESOURCE_FILE_INVALID");
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (!ALLOWED_MIME_EXT_MAP[mimeType]?.includes(extension) || !checkMagicBytes(file.buffer, extension)) throw fail("File content does not match its declared type.", 415, "RESOURCE_FILE_INVALID");
  const originalName = path.basename(file.originalname || "resource").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
  if (!originalName || !extension) throw fail("Invalid resource filename.", 400, "RESOURCE_FILENAME_INVALID");
  const key = String(idempotencyKey || "");
  if (key && !/^[a-zA-Z0-9_-]{8,80}$/.test(key)) throw fail("Invalid idempotency key.", 400, "INVALID_IDEMPOTENCY_KEY");
  if (key) {
    const existing = await ProtectedMediaAsset.findOne({ creatorId: course.creatorId, uploadIdempotencyKey: key });
    if (existing) {
      if (String(existing.courseId) !== String(course._id) || existing.sizeBytes !== file.size || existing.mimeType !== mimeType) throw fail("Idempotency key conflicts with a different upload.", 409, "UPLOAD_CONFLICT");
      if (existing.deliveryStatus === "ready") return existing;
      throw fail("Upload is already in progress or failed.", 409, "UPLOAD_NOT_READY");
    }
  }
  let resource = null;
  if (resourceId) {
    resource = await LearningResource.findOne({ _id: resourceId, courseId: course._id, isSystemOwned: true }).select("+assetId +externalUrl");
    if (!resource) throw fail("Course material not found.", 404, "RESOURCE_NOT_FOUND");
  }
  const provider = storage.provider();
  const asset = await ProtectedMediaAsset.create({
    creatorId: course.creatorId, uploadedBy: userId, courseId: course._id, mediaKind: "resource", provider,
    storageKey: storage.newKey(String(course.creatorId)), bucket: provider === "r2" ? require("../config/env").storage.r2Bucket : "",
    originalName, mimeType, sizeBytes: file.size, uploadIdempotencyKey: key,
    rightsConfirmedAt: new Date(), accessLevel: course.accessLevel, scanStatus: "unavailable", deliveryStatus: "pending", status: "draft",
  });
  try {
    const stored = await storage.put({ key: asset.storageKey, buffer: file.buffer, mimeType });
    asset.checksum = stored.checksum;
    asset.deliveryStatus = "ready";
    await asset.save();
    if (resource) {
      resource.assetId = asset._id;
      resource.externalUrl = "";
      resource.textContent = "";
      resource.filename = originalName;
      resource.sizeBytes = file.size;
      resource.publicationStatus = "published";
      if (!resource.publishedAt) resource.publishedAt = new Date();
      await resource.save();
    }
    return asset;
  } catch (error) {
    asset.deliveryStatus = "failed";
    await asset.save().catch(() => {});
    throw error;
  }
};

const authorizeResource = async ({ resource, userId, creatorId = null, admin = false }) => {
  const owner = Boolean(creatorId && String(creatorId) === String(resource.creatorId));
  const course = resource.courseId ? await Course.findOne({ _id: resource.courseId, isDeleted: false }).lean() : null;
  if (resource.courseId && !course) throw fail("Resource not found.", 404, "RESOURCE_NOT_FOUND");
  if (resource.publicationStatus !== "published" || (course && course.publicationStatus !== "published")) {
    if (!owner && !admin) throw fail("Resource not found.", 404, "RESOURCE_NOT_FOUND");
  }
  const access = await resolveLearnAccess({
    userId, courseId: course?._id, monetizationType: course?.monetizationType,
    accessLevel: course?.monetizationType === "PREMIUM_INCLUDED" || course?.accessLevel === "premium" || resource.accessLevel === "premium" ? "premium" : "free",
    owner, admin,
  });
  if (!access.allowed) throw fail("This resource requires Course access.", 403, access.reason === "standalone_purchase_required" ? "COURSE_PURCHASE_REQUIRED" : "PREMIUM_REQUIRED");
};

const getDownload = async ({ slug, userId, creatorId = null, admin = false }) => {
  const resource = await LearningResource.findOne({ slug, isDeleted: { $ne: true } }).select("+assetId +externalUrl").lean();
  if (!resource || !resource.assetId) throw fail("Stored resource not found.", 404, "RESOURCE_NOT_FOUND");
  await authorizeResource({ resource, userId, creatorId, admin });
  const asset = await ProtectedMediaAsset.findOne({ _id: resource.assetId, status: { $ne: "removed" } }).select("+storageKey +checksum +bucket").lean();
  if (!asset || asset.deliveryStatus !== "ready" || !asset.storageKey || String(asset.courseId) !== String(resource.courseId)) throw fail("Resource is not ready.", 503, "RESOURCE_NOT_READY");
  const details = await storage.head(asset);
  if (details.sizeBytes !== asset.sizeBytes || details.mimeType !== asset.mimeType) throw fail("Stored resource integrity check failed.", 503, "RESOURCE_INTEGRITY_ERROR");
  return { asset, stream: await storage.read(asset) };
};

const deleteUnlinkedAsset = async ({ assetId, creatorId }) => {
  const asset = await ProtectedMediaAsset.findOne({ _id: assetId, creatorId, mediaKind: "resource", status: { $ne: "removed" } }).select("+storageKey +bucket");
  if (!asset) throw fail("Stored asset not found.", 404, "ASSET_NOT_FOUND");
  if (await LearningResource.exists({ assetId: asset._id, isDeleted: { $ne: true } })) throw fail("Asset is attached to a resource.", 409, "ASSET_IN_USE");
  if (asset.storageKey && asset.deliveryStatus === "ready") await storage.remove(asset);
  asset.status = "removed";
  asset.deletedAt = new Date();
  await asset.save();
  return { deleted: true };
};

module.exports = { acceptFile, uploadResource, authorizeResource, getDownload, deleteUnlinkedAsset };
