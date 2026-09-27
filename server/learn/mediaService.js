const CreatorProfile = require("../models/CreatorProfile");
const CreatorVideo = require("../models/CreatorVideo");
const LearningResource = require("../models/LearningResource");
const PodcastEpisode = require("../models/PodcastEpisode");
const PodcastSeries = require("../models/PodcastSeries");
const ProtectedMediaAsset = require("../models/ProtectedMediaAsset");
const Course = require("../models/Course");
const Topic = require("../models/Topic");
const mongoose = require("mongoose");
const { resolveLearnAccess } = require("./accessPolicy");
const resourceStorage = require("./resourceStorageService");
const MediaProvider = require("./mediaProviderService");
const { serializePodcast, serializeResource, serializeVideo } = require("./serializers");
const { MEDIA_LIMITS } = require("./constants");
const { escapeRegex, slugify } = require("../creators/utils");

const errorWith = (message, status, code) => Object.assign(new Error(message), { status, code });
const creatorPopulate = "displayName slug headline profileImage";
const topicPopulate = "name slug";

const allowedMimes = Object.freeze({
  image: ["image/jpeg", "image/png", "image/webp"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
  resource: ["application/pdf", "application/zip", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  video: ["video/mp4", "video/webm"],
});

const uniqueSlug = async (Model, title) => {
  const base = slugify(title) || "content";
  let candidate = base;
  let suffix = 1;
  while (await Model.exists({ slug: candidate })) candidate = `${base}-${suffix++}`;
  return candidate;
};

const paginate = (query) => ({
  page: Math.max(1, Number.parseInt(query.page, 10) || 1),
  limit: Math.min(48, Math.max(1, Number.parseInt(query.limit, 10) || 18)),
});

const listPublished = async (Model, query, serializer, extraFilter = {}) => {
  const { page, limit } = paginate(query);
  const filter = { publicationStatus: "published", isDeleted: { $ne: true }, ...extraFilter };
  if (query.creator) {
    const creatorRaw = String(query.creator).trim();
    if (mongoose.isValidObjectId(creatorRaw)) {
      filter.creatorId = creatorRaw;
    } else {
      const creatorDoc = await CreatorProfile.findOne({
        slug: slugify(creatorRaw) || creatorRaw.toLowerCase(),
        status: "active",
      }).select("_id").lean();
      if (creatorDoc) {
        filter.creatorId = creatorDoc._id;
      } else {
        filter.creatorId = new mongoose.Types.ObjectId();
      }
    }
  }
  const topicParam = query.topic || query.topicIds || query.topicSlug || query.topicId;
  if (topicParam) {
    let topicDoc = null;
    const topicRaw = String(Array.isArray(topicParam) ? topicParam[0] : topicParam).trim();
    if (mongoose.isValidObjectId(topicRaw)) {
      topicDoc = await Topic.findOne({ _id: topicRaw, status: "active" }).select("_id").lean();
    }
    if (!topicDoc) {
      topicDoc = await Topic.findOne({
        slug: slugify(topicRaw) || topicRaw.toLowerCase(),
        status: "active",
      }).select("_id").lean();
    }
    if (!topicDoc) {
      topicDoc = await Topic.findOne({
        name: new RegExp(`^${escapeRegex(topicRaw)}$`, "i"),
        status: "active",
      }).select("_id").lean();
    }
    if (topicDoc) {
      filter.topicIds = topicDoc._id;
    } else {
      filter.topicIds = new mongoose.Types.ObjectId();
    }
  }
  if (query.language) filter.language = query.language;
  if (query.accessLevel) filter.accessLevel = query.accessLevel;
  if (query.search) filter.$text = { $search: String(query.search).slice(0, 100) };
  const [items, total] = await Promise.all([
    Model.find(filter).populate("creatorId", creatorPopulate).populate("topicIds", topicPopulate).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  return { items: items.map((item) => serializer(item, { allowed: item.accessLevel === "free" })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getPublished = async (Model, slug, serializer, userId, extraFilter = {}) => {
  const item = await Model.findOne({ slug, publicationStatus: "published", ...extraFilter })
    .select("+transcript +captionAssetIds +mediaAssetId +showNotes +chapters +assetId +externalUrl")
    .populate("creatorId", creatorPopulate)
    .populate("topicIds", topicPopulate)
    .lean();
  if (!item) throw errorWith("Learning content not found.", 404, "LEARN_CONTENT_NOT_FOUND");
  const access = await resolveLearnAccess({ userId, accessLevel: item.accessLevel });
  return serializer(item, { allowed: access.allowed });
};

const registerAssetMetadata = async (creator, userId, input) => {
  const mediaKind = String(input.mediaKind || "");
  const mimeType = String(input.mimeType || "").toLowerCase();
  const sizeBytes = Number(input.sizeBytes || 0);
  if (!MEDIA_LIMITS[mediaKind] || !allowedMimes[mediaKind]?.includes(mimeType)) throw errorWith("Unsupported media type.", 415, "UNSUPPORTED_MEDIA_TYPE");
  if (sizeBytes <= 0 || sizeBytes > MEDIA_LIMITS[mediaKind]) throw errorWith("Asset exceeds the configured upload limit.", 413, "MEDIA_QUOTA_EXCEEDED");
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this asset.", 422, "CONTENT_RIGHTS_REQUIRED");
  return ProtectedMediaAsset.create({
    creatorId: creator._id,
    uploadedBy: userId,
    mediaKind,
    originalName: String(input.originalName || "asset").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180),
    mimeType,
    sizeBytes,
    durationSeconds: Number(input.durationSeconds || 0),
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    rightsConfirmedAt: new Date(),
    provider: "unconfigured",
    scanStatus: "unavailable",
    deliveryStatus: "pending",
  });
};

const assertOwnedAsset = async (creatorId, assetId, expectedKinds) => {
  const asset = await ProtectedMediaAsset.findOne({ _id: assetId, creatorId });
  if (!asset) throw errorWith("Media asset not found.", 404, "MEDIA_ASSET_NOT_FOUND");
  if (!expectedKinds.includes(asset.mediaKind)) throw errorWith("Media asset type does not match this content format.", 422, "MEDIA_ASSET_TYPE_MISMATCH");
  return asset;
};

const createVideo = async (creator, input) => {
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this Video.", 422, "CONTENT_RIGHTS_REQUIRED");
  await assertOwnedAsset(creator._id, input.mediaAssetId, ["video"]);
  return CreatorVideo.create({
    creatorId: creator._id,
    title: String(input.title || "").trim(),
    slug: await uniqueSlug(CreatorVideo, input.title),
    description: String(input.description || "").trim(),
    topicIds: Array.isArray(input.topicIds) ? input.topicIds.slice(0, 12) : [],
    language: String(input.language || "English"),
    durationSeconds: Number(input.durationSeconds || 0),
    thumbnail: String(input.thumbnail || ""),
    thumbnailAlt: String(input.thumbnailAlt || ""),
    mediaAssetId: input.mediaAssetId,
    transcript: String(input.transcript || ""),
    captionAssetIds: Array.isArray(input.captionAssetIds) ? input.captionAssetIds.slice(0, 20) : [],
    courseId: input.courseId || null,
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    rightsConfirmedAt: new Date(),
  });
};

const createPodcastSeries = async (creator, input) => {
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this Podcast.", 422, "CONTENT_RIGHTS_REQUIRED");
  return PodcastSeries.create({
    creatorId: creator._id,
    title: String(input.title || "").trim(),
    slug: await uniqueSlug(PodcastSeries, input.title),
    description: String(input.description || "").trim(),
    topicIds: Array.isArray(input.topicIds) ? input.topicIds.slice(0, 12) : [],
    language: String(input.language || "English"),
    coverImage: String(input.coverImage || ""),
    coverImageAlt: String(input.coverImageAlt || ""),
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    rightsConfirmedAt: new Date(),
  });
};

const createPodcastEpisode = async (creator, input) => {
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this Podcast episode.", 422, "CONTENT_RIGHTS_REQUIRED");
  const series = await PodcastSeries.findOne({ _id: input.seriesId, creatorId: creator._id });
  if (!series) throw errorWith("Podcast Series not found.", 404, "PODCAST_SERIES_NOT_FOUND");
  await assertOwnedAsset(creator._id, input.mediaAssetId, ["audio"]);
  return PodcastEpisode.create({
    creatorId: creator._id,
    seriesId: series._id,
    title: String(input.title || "").trim(),
    slug: await uniqueSlug(PodcastEpisode, input.title),
    description: String(input.description || "").trim(),
    topicIds: series.topicIds,
    language: series.language,
    mediaAssetId: input.mediaAssetId,
    durationSeconds: Number(input.durationSeconds || 0),
    seasonNumber: Number(input.seasonNumber || 1),
    episodeNumber: Number(input.episodeNumber || 1),
    transcript: String(input.transcript || ""),
    showNotes: String(input.showNotes || ""),
    chapters: Array.isArray(input.chapters) ? input.chapters.slice(0, 100) : [],
    coverImage: series.coverImage,
    accessLevel: input.accessLevel === "premium" ? "premium" : series.accessLevel,
    publicationStatus: "draft",
    workflowStatus: "draft",
    isPublished: false,
    rightsConfirmedAt: new Date(),
  });
};

const createResource = async (creator, input) => {
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this Resource.", 422, "CONTENT_RIGHTS_REQUIRED");
  let course = null;
  if (input.courseId) {
    course = await Course.findOne({ _id: input.courseId, creatorId: creator._id, isDeleted: false }).lean();
    if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  }
  if (input.assetId) {
    const asset = await assertOwnedAsset(creator._id, input.assetId, ["document", "resource", "image"]);
    if (asset.provider !== "unconfigured" && (asset.deliveryStatus !== "ready" || String(asset.courseId) !== String(course?._id))) throw errorWith("Stored asset is not ready for this Course.", 422, "ASSET_NOT_READY");
  }
  return LearningResource.create({
    creatorId: creator._id,
    title: String(input.title || "").trim(),
    slug: await uniqueSlug(LearningResource, input.title),
    description: String(input.description || "").trim(),
    resourceType: input.resourceType,
    topicIds: Array.isArray(input.topicIds) ? input.topicIds.slice(0, 12) : [],
    language: String(input.language || "English"),
    assetId: input.assetId || null,
    externalUrl: String(input.externalUrl || ""),
    sizeBytes: Number(input.sizeBytes || 0),
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    courseId: course?._id || null,
    lessonId: input.lessonId || null,
    rightsConfirmedAt: new Date(),
  });
};

const issueAssetAccess = async ({ assetId, userId, purpose = "playback", admin = false }) => {
  const asset = await ProtectedMediaAsset.findById(assetId).select("+providerAssetId +storageKey").lean();
  if (!asset || asset.status === "removed") throw errorWith("Media asset not found.", 404, "MEDIA_ASSET_NOT_FOUND");
  if (asset.provider === "mux") throw errorWith("Use the Lesson playback endpoint for Course video.", 404, "MEDIA_ASSET_NOT_FOUND");
  const creator = userId ? await CreatorProfile.findOne({ userId }).select("_id").lean() : null;
  if (asset.storageKey) {
    const resource = await LearningResource.findOne({ assetId: asset._id, isDeleted: { $ne: true } }).select("+assetId").lean();
    if (!resource) throw errorWith("Resource not found.", 404, "RESOURCE_NOT_FOUND");
    await resourceStorage.authorizeResource({ resource, userId, creatorId: creator?._id, admin });
    if (purpose !== "download") throw errorWith("Stored resources must be downloaded.", 400, "INVALID_MEDIA_PURPOSE");
    return { downloadPath: `/api/learn/resources/${encodeURIComponent(resource.slug)}/download` };
  }
  const access = await resolveLearnAccess({ userId, accessLevel: asset.accessLevel, owner: String(creator?._id || "") === String(asset.creatorId), admin });
  if (!access.allowed) throw errorWith("MyJourney Premium is required for this media.", 403, "PREMIUM_REQUIRED");
  if (asset.scanStatus !== "clean" || asset.deliveryStatus !== "ready") throw errorWith("This media is not ready for secure delivery.", 503, "MEDIA_NOT_READY");
  return purpose === "download" ? MediaProvider.issueDownload(asset) : MediaProvider.issuePlayback(asset);
};

module.exports = {
  createPodcastEpisode,
  createPodcastSeries,
  createResource,
  createVideo,
  getPodcast: (slug, userId) => getPublished(PodcastEpisode, slug, serializePodcast, userId, { creatorId: { $ne: null } }),
  getResource: async (slug, userId) => {
    const resource = await LearningResource.findOne({ slug, publicationStatus: "published", isDeleted: { $ne: true } }).select("+assetId +externalUrl").lean();
    if (!resource) throw errorWith("Learning content not found.", 404, "LEARN_CONTENT_NOT_FOUND");
    try { await resourceStorage.authorizeResource({ resource, userId }); return serializeResource(resource, { allowed: true }); }
    catch (error) { if (![403, 404].includes(error.status)) throw error; return serializeResource(resource, { allowed: false }); }
  },
  getVideo: (slug, userId) => getPublished(CreatorVideo, slug, serializeVideo, userId),
  issueAssetAccess,
  listPodcasts: (query) => listPublished(PodcastEpisode, query, serializePodcast, { creatorId: { $ne: null } }),
  listResources: (query) => listPublished(LearningResource, query, (item) => serializeResource(item, { allowed: false })),
  listVideos: (query) => listPublished(CreatorVideo, query, serializeVideo),
  registerAssetMetadata,
};
