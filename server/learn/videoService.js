const path = require("path");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseLesson = require("../models/CourseLesson");
const ProtectedMediaAsset = require("../models/ProtectedMediaAsset");
const { MEDIA_LIMITS } = require("./constants");
const { resolveLearnAccess } = require("./accessPolicy");
const MediaProvider = require("./mediaProviderService");

const fail = (message, status, code) => Object.assign(new Error(message), { status, code });
const safeAsset = (asset) => ({ id: String(asset._id), courseId: String(asset.courseId), lessonId: String(asset.lessonId), status: asset.status, deliveryStatus: asset.deliveryStatus, durationSeconds: asset.durationSeconds || 0, error: asset.deliveryStatus === "failed" ? "Video processing failed. Please upload again." : "" });

const ownedLesson = async ({ courseId, lessonId, creatorId = null, admin = false }) => {
  const course = await Course.findOne({ _id: courseId, isDeleted: false, ...(admin ? {} : { creatorId }) }).lean();
  if (!course) throw fail("Course not found.", 404, "COURSE_NOT_FOUND");
  const lesson = await CourseLesson.findOne({ _id: lessonId, courseId: course._id, isDeleted: false }).select("+mediaAssetId");
  if (!lesson) throw fail("Lesson not found.", 404, "LESSON_NOT_FOUND");
  return { course, lesson };
};

const listOwnedLessons = async ({ courseId, creatorId = null, admin = false }) => {
  const course = await Course.findOne({ _id: courseId, isDeleted: false, ...(admin ? {} : { creatorId }) }).lean();
  if (!course) throw fail("Course not found.", 404, "COURSE_NOT_FOUND");
  const lessons = await CourseLesson.find({ courseId: course._id, isDeleted: false }).select("title lessonType mediaAssetId").sort({ order: 1 }).lean();
  const assets = await ProtectedMediaAsset.find({ courseId: course._id, creatorId: course.creatorId, provider: "mux", status: { $ne: "removed" } }).sort({ createdAt: -1 }).limit(1000).lean();
  const latestByLesson = new Map();
  for (const asset of assets) if (!latestByLesson.has(String(asset.lessonId))) latestByLesson.set(String(asset.lessonId), safeAsset(asset));
  return lessons.map((lesson) => ({ id: String(lesson._id), title: lesson.title, lessonType: lesson.lessonType, mediaAssetId: lesson.mediaAssetId ? String(lesson.mediaAssetId) : null, latestVideoAsset: latestByLesson.get(String(lesson._id)) || null }));
};

const initiateUpload = async ({ courseId, lessonId, creatorId = null, userId, admin = false, input }) => {
  const { course, lesson } = await ownedLesson({ courseId, lessonId, creatorId, admin });
  if (!admin && !["draft", "changes_requested"].includes(course.workflowStatus)) throw fail("This Course is not editable.", 409, "COURSE_NOT_EDITABLE");
  if (!["video", "mixed"].includes(lesson.lessonType)) throw fail("Only video or mixed lessons accept video uploads.", 422, "LESSON_TYPE_MISMATCH");
  const mimeType = String(input?.mimeType || "").toLowerCase();
  const name = path.basename(String(input?.originalName || "")).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
  const sizeBytes = Number(input?.sizeBytes);
  if (![["video/mp4", ".mp4"], ["video/webm", ".webm"]].some(([mime, ext]) => mimeType === mime && name.toLowerCase().endsWith(ext))) throw fail("Only MP4 or WebM video is supported.", 415, "VIDEO_TYPE_INVALID");
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MEDIA_LIMITS.video) throw fail("Video exceeds the upload limit.", 413, "VIDEO_SIZE_INVALID");
  if (input?.confirmContentRights !== true) throw fail("Confirm video content rights.", 422, "CONTENT_RIGHTS_REQUIRED");
  if (!MediaProvider.capability().directUploadAvailable) throw fail("Mux video upload is not configured.", 503, "MEDIA_PROVIDER_UNAVAILABLE");
  const asset = await ProtectedMediaAsset.create({
    creatorId: course.creatorId, uploadedBy: userId, courseId: course._id, lessonId: lesson._id,
    mediaKind: "video", provider: "mux", originalName: name, mimeType, sizeBytes,
    accessLevel: course.accessLevel, scanStatus: "unavailable", deliveryStatus: "pending", status: "draft", rightsConfirmedAt: new Date(),
  });
  try {
    const upload = await MediaProvider.createUploadSession({ assetId: asset._id });
    asset.muxUploadId = upload.uploadId;
    await asset.save();
    return { asset: safeAsset(asset), uploadUrl: upload.uploadUrl, expiresInSeconds: upload.expiresInSeconds };
  } catch (error) {
    asset.deliveryStatus = "failed";
    await asset.save().catch(() => {});
    throw error;
  }
};

const getStatus = async ({ courseId, lessonId, assetId, creatorId = null, admin = false }) => {
  const { course } = await ownedLesson({ courseId, lessonId, creatorId, admin });
  const asset = await ProtectedMediaAsset.findOne({ _id: assetId, creatorId: course.creatorId, courseId: course._id, lessonId, provider: "mux", status: { $ne: "removed" } });
  if (!asset) throw fail("Video asset not found.", 404, "VIDEO_ASSET_NOT_FOUND");
  return safeAsset(asset);
};

const attachVideo = async ({ courseId, lessonId, assetId, creatorId = null, admin = false }) => {
  const { course, lesson } = await ownedLesson({ courseId, lessonId, creatorId, admin });
  if (!admin && !["draft", "changes_requested"].includes(course.workflowStatus)) throw fail("This Course is not editable.", 409, "COURSE_NOT_EDITABLE");
  if (assetId !== null && !mongoose.isValidObjectId(assetId)) throw fail("A ready video asset ID or explicit null is required.", 422, "VIDEO_ASSET_ID_REQUIRED");
  if (assetId === null) {
    lesson.mediaAssetId = null;
    await lesson.save();
    return { attachedAssetId: null };
  }
  const asset = await ProtectedMediaAsset.findOne({ _id: assetId, creatorId: course.creatorId, courseId: course._id, lessonId: lesson._id, provider: "mux", mediaKind: "video", deliveryStatus: "ready", status: "active" }).select("+muxPlaybackId");
  if (!asset?.muxPlaybackId) throw fail("Video is not ready or does not belong to this Lesson.", 422, "VIDEO_NOT_READY");
  lesson.mediaAssetId = asset._id;
  await lesson.save();
  return { attachedAssetId: String(asset._id) };
};

const playbackForLesson = async ({ courseSlug, lessonId, userId = null }) => {
  const course = await Course.findOne({ slug: courseSlug, publicationStatus: "published", isDeleted: false }).lean();
  if (!course) throw fail("Course not found.", 404, "COURSE_NOT_FOUND");
  const lessonFilter = mongoose.isValidObjectId(lessonId) ? { _id: lessonId } : { stableKey: lessonId };
  const lesson = await CourseLesson.findOne({ ...lessonFilter, courseId: course._id, isDeleted: false }).select("+mediaAssetId").lean();
  if (!lesson || !lesson.mediaAssetId) throw fail("Video not found.", 404, "VIDEO_NOT_FOUND");
  if (!lesson.isPreview) {
    const access = await resolveLearnAccess({ userId, courseId: course._id, monetizationType: course.monetizationType, accessLevel: course.monetizationType === "PREMIUM_INCLUDED" ? "premium" : course.accessLevel });
    if (!access.allowed) throw fail("Course access is required for this video.", 403, access.reason === "standalone_purchase_required" ? "COURSE_PURCHASE_REQUIRED" : "PREMIUM_REQUIRED");
  }
  const asset = await ProtectedMediaAsset.findOne({ _id: lesson.mediaAssetId, creatorId: course.creatorId, courseId: course._id, lessonId: lesson._id, provider: "mux", mediaKind: "video", deliveryStatus: "ready", status: "active" }).select("+muxPlaybackId").lean();
  if (!asset?.muxPlaybackId) throw fail("Video is still processing or unavailable.", 503, "VIDEO_NOT_READY");
  return MediaProvider.issuePlayback(asset);
};

const applyWebhookEvent = async (event) => {
  const type = String(event?.type || "");
  if (!new Set(["video.upload.asset_created", "video.upload.timed_out", "video.upload.cancelled", "video.asset.created", "video.asset.ready", "video.asset.errored", "video.asset.deleted"]).has(type)) return { ignored: true };
  const data = event?.data || {};
  const passthrough = String(data.passthrough || "");
  let asset = null;
  if (mongoose.isValidObjectId(passthrough)) asset = await ProtectedMediaAsset.findOne({ _id: passthrough, provider: "mux" }).select("+providerAssetId +muxUploadId +muxPlaybackId +muxError");
  if (!asset && type.startsWith("video.upload.") && data.id) asset = await ProtectedMediaAsset.findOne({ muxUploadId: String(data.id), provider: "mux" }).select("+providerAssetId +muxUploadId +muxPlaybackId +muxError");
  if (!asset && type.startsWith("video.asset.") && data.id) asset = await ProtectedMediaAsset.findOne({ providerAssetId: String(data.id), provider: "mux" }).select("+providerAssetId +muxUploadId +muxPlaybackId +muxError");
  if (!asset || asset.status === "removed") return { ignored: true };
  if (type.startsWith("video.asset.") && asset.providerAssetId && asset.providerAssetId !== String(data.id)) throw fail("Mux asset identity mismatch.", 409, "MUX_ASSET_MISMATCH");
  if (type === "video.upload.asset_created" && asset.providerAssetId && asset.providerAssetId !== String(data.asset_id)) throw fail("Mux asset identity mismatch.", 409, "MUX_ASSET_MISMATCH");
  if (type === "video.asset.ready" && asset.deliveryStatus === "failed") return { ignored: true };
  if (type === "video.upload.asset_created") {
    if (data.asset_id) asset.providerAssetId = String(data.asset_id);
  } else if (type === "video.upload.timed_out" || type === "video.upload.cancelled" || type === "video.asset.errored") {
    if (asset.deliveryStatus === "ready" && type.startsWith("video.upload.")) return { ignored: true };
    asset.deliveryStatus = "failed";
    asset.muxError = type;
    if (type === "video.asset.errored" && data.id) asset.providerAssetId = String(data.id);
  } else if (type === "video.asset.deleted") {
    asset.status = "removed";
    asset.deliveryStatus = "failed";
    asset.deletedAt = new Date();
  } else if (type === "video.asset.created") {
    asset.providerAssetId = String(data.id);
  } else if (type === "video.asset.ready") {
    const playback = data.playback_ids?.find((id) => id.policy === "signed");
    if (!playback?.id) throw fail("Mux asset lacks signed playback.", 422, "MUX_SIGNED_PLAYBACK_REQUIRED");
    asset.providerAssetId = String(data.id);
    asset.muxPlaybackId = String(playback.id);
    asset.durationSeconds = Number(data.duration || 0);
    asset.aspectRatio = String(data.aspect_ratio || "").slice(0, 24);
    asset.deliveryStatus = "ready";
    asset.status = "active";
    if (!asset.readyAt) asset.readyAt = new Date();
  }
  await asset.save();
  return { processed: true };
};

module.exports = { initiateUpload, getStatus, attachVideo, playbackForLesson, applyWebhookEvent, listOwnedLessons };
