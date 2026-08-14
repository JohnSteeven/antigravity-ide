const mongoose = require("mongoose");
const CreatorApplication = require("../models/CreatorApplication");
const CreatorProfile = require("../models/CreatorProfile");
const UserFollow = require("../models/UserFollow");
const Article = require("../models/Article");
const Course = require("../models/Course");
const CreatorVideo = require("../models/CreatorVideo");
const PodcastEpisode = require("../models/PodcastEpisode");
const LearningResource = require("../models/LearningResource");
const { serializePublicContent } = require("../premium/contentPreview");
const { serializeCourse, serializePodcast, serializeResource, serializeVideo } = require("../learn/serializers");
const { escapeRegex, safePublicLinks, uniqueStrings } = require("./utils");

const FEATURE_CONFIG = Object.freeze({
  article: { Model: Article, owner: "creatorProfileId", filter: { contentType: "article", status: "published", isDeleted: false }, select: "title slug description excerpt coverImage coverImageAlt author readingTime accessLevel publishedAt contentType" },
  story: { Model: Article, owner: "creatorProfileId", filter: { contentType: "story", status: "published", isDeleted: false }, select: "title slug description excerpt coverImage coverImageAlt author readingTime accessLevel publishedAt contentType storyLayout" },
  course: { Model: Course, owner: "creatorId", filter: { publicationStatus: "published", isDeleted: false }, select: "title slug subtitle description coverImage coverImageAlt accessLevel level language lessonCount estimatedDurationMinutes publishedAt" },
  video: { Model: CreatorVideo, owner: "creatorId", filter: { publicationStatus: "published", isDeleted: false }, select: "title slug description thumbnail thumbnailAlt durationSeconds accessLevel language publishedAt" },
  podcast: { Model: PodcastEpisode, owner: "creatorId", filter: { publicationStatus: "published" }, select: "title slug description coverImage durationSeconds seasonNumber episodeNumber accessLevel language publishedAt" },
  resource: { Model: LearningResource, owner: "creatorId", filter: { publicationStatus: "published" }, select: "title slug description resourceType sizeBytes accessLevel language publishedAt" },
});

const serializeFeatured = (contentType, item) => {
  if (!item) return null;
  if (["article", "story"].includes(contentType)) return { ...serializePublicContent(item, { listing: true }), contentType };
  if (contentType === "course") return { ...serializeCourse(item), contentType };
  if (contentType === "video") return { ...serializeVideo(item, { allowed: item.accessLevel === "free" }), contentType };
  if (contentType === "podcast") return { ...serializePodcast(item, { allowed: item.accessLevel === "free" }), contentType };
  return { ...serializeResource(item, { allowed: item.accessLevel === "free" }), contentType };
};

const publicProfile = (profile) => {
  if (!profile) return null;
  const source = profile.toObject ? profile.toObject() : { ...profile };
  delete source.userId;
  delete source.applicationId;
  delete source.verifiedBy;
  delete source.__v;
  return source;
};

const listCreators = async (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(query.limit, 10) || 18));
  const filter = { status: "active" };
  if (query.featured === "true") filter.isFeatured = true;
  if (query.specialty) filter.specialties = String(query.specialty);
  if (query.language) filter.languages = String(query.language);
  if (query.format) filter.creatorTypes = String(query.format);
  if (query.search) {
    const regex = new RegExp(escapeRegex(String(query.search).slice(0, 80)), "i");
    filter.$or = [{ displayName: regex }, { headline: regex }, { biography: regex }, { specialties: regex }];
  }
  const sort = query.sort === "popular"
    ? { "metrics.followerCount": -1, createdAt: -1 }
    : query.sort === "new"
      ? { createdAt: -1 }
      : { isFeatured: -1, "metrics.publishedContentCount": -1, createdAt: -1 };
  const [items, total, specialties, languages, formats] = await Promise.all([
    CreatorProfile.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    CreatorProfile.countDocuments(filter),
    CreatorProfile.distinct("specialties", { status: "active" }),
    CreatorProfile.distinct("languages", { status: "active" }),
    CreatorProfile.distinct("creatorTypes", { status: "active" }),
  ]);
  return { creators: items.map(publicProfile), facets: { specialties: specialties.sort(), languages: languages.sort(), formats: formats.sort() }, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getCapability = async (userId) => {
  const [profile, application] = await Promise.all([
    CreatorProfile.findOne({ userId }).lean(),
    CreatorApplication.findOne({ userId }).select("status applicantMessage submittedAt reviewedAt").lean(),
  ]);
  return {
    studioAvailable: profile?.status === "active",
    creatorStatus: profile?.status || null,
    applicationStatus: application?.status || null,
    applicationMessage: application?.applicantMessage || "",
    creatorSlug: profile?.slug || null,
  };
};

const creatorFollowFilter = (followerId, profile) => ({
  ...(followerId ? { followerId } : {}),
  targetType: "creator",
  targetId: String(profile.creatorKey),
});

const isCreatorOwner = (profile, userId) => Boolean(profile?.userId && userId && String(profile.userId) === String(userId));

const getCreatorFollowState = async (profile, followerId = null) => {
  const targetFilter = creatorFollowFilter(null, profile);
  const [followerCount, existing] = await Promise.all([
    UserFollow.countDocuments(targetFilter),
    followerId ? UserFollow.exists(creatorFollowFilter(followerId, profile)) : null,
  ]);
  return { followerCount: Math.max(0, Number(followerCount) || 0), isFollowing: Boolean(existing) };
};

const getPublicProfile = async (slug, viewerId = null) => {
  const profile = await CreatorProfile.findOne({ slug, status: "active" }).lean();
  if (!profile) return null;
  const creatorId = profile._id;
  const isOwner = isCreatorOwner(profile, viewerId);
  const [articles, stories, courses, videos, podcasts, resources, followState] = await Promise.all([
    Article.find({ creatorProfileId: creatorId, contentType: "article", status: "published", isDeleted: false }).select("title slug description excerpt coverImage coverImageAlt author readingTime accessLevel publishedAt contentType").sort({ publishedAt: -1 }).limit(12).lean(),
    Article.find({ creatorProfileId: creatorId, contentType: "story", status: "published", isDeleted: false }).select("title slug description excerpt coverImage coverImageAlt author readingTime accessLevel publishedAt contentType storyLayout").sort({ publishedAt: -1 }).limit(12).lean(),
    Course.find({ creatorId, publicationStatus: "published", isDeleted: false }).select("title slug subtitle description coverImage coverImageAlt accessLevel level language lessonCount estimatedDurationMinutes publishedAt").sort({ publishedAt: -1 }).limit(12).lean(),
    CreatorVideo.find({ creatorId, publicationStatus: "published", isDeleted: false }).select("title slug description thumbnail thumbnailAlt durationSeconds accessLevel language publishedAt").sort({ publishedAt: -1 }).limit(12).lean(),
    PodcastEpisode.find({ creatorId, publicationStatus: "published" }).select("title slug description coverImage durationSeconds seasonNumber episodeNumber accessLevel language publishedAt").sort({ publishedAt: -1 }).limit(12).lean(),
    LearningResource.find({ creatorId, publicationStatus: "published" }).select("title slug description resourceType sizeBytes accessLevel language publishedAt").sort({ publishedAt: -1 }).limit(12).lean(),
    getCreatorFollowState(profile, isOwner ? null : viewerId),
  ]);
  const shelves = {
    articles: articles.map((item) => serializePublicContent(item, { listing: true })),
    stories: stories.map((item) => serializePublicContent(item, { listing: true })),
    courses: courses.map((item) => serializeCourse(item)),
    videos: videos.map((item) => serializeVideo(item, { allowed: item.accessLevel === "free" })),
    podcasts: podcasts.map((item) => serializePodcast(item, { allowed: item.accessLevel === "free" })),
    resources: resources.map((item) => serializeResource(item, { allowed: item.accessLevel === "free" })),
  };
  const featured = (await Promise.all((profile.featuredContent || []).map(async ({ contentType, contentId }) => {
    const config = FEATURE_CONFIG[contentType];
    if (!config) return null;
    const item = await config.Model.findOne({ _id: contentId, [config.owner]: creatorId, ...config.filter }).select(config.select).lean();
    return serializeFeatured(contentType, item);
  }))).filter(Boolean);
  if (featured.length) shelves.featured = featured;
  const orderedModules = (profile.moduleOrder || []).filter((module) => module !== "featured");
  const modules = [...(featured.length ? ["featured"] : []), ...orderedModules.filter((module) => module === "about" || (shelves[module]?.length > 0))];
  const serializedProfile = publicProfile(profile);
  return { ...serializedProfile, metrics: { ...(serializedProfile.metrics || {}), followerCount: followState.followerCount }, isFollowing: followState.isFollowing, isOwner, modules, shelves };
};

const updateOwnProfile = async (creatorId, input) => {
  const allowed = {};
  if (input.displayName !== undefined) allowed.displayName = String(input.displayName).trim().slice(0, 100);
  if (input.headline !== undefined) allowed.headline = String(input.headline).trim().slice(0, 180);
  if (input.biography !== undefined) allowed.biography = String(input.biography).trim().slice(0, 5000);
  if (input.profileImage !== undefined) allowed.profileImage = String(input.profileImage).trim();
  if (input.coverImage !== undefined) allowed.coverImage = String(input.coverImage).trim();
  if (input.specialties !== undefined) allowed.specialties = uniqueStrings(input.specialties, 20);
  if (input.languages !== undefined) allowed.languages = uniqueStrings(input.languages, 12);
  if (input.creatorTypes !== undefined) allowed.creatorTypes = uniqueStrings(input.creatorTypes, 12);
  if (input.publicLinks !== undefined) allowed.publicLinks = safePublicLinks(input.publicLinks);
  if (input.moduleOrder !== undefined) allowed.moduleOrder = uniqueStrings(input.moduleOrder, 10);
  const profile = await CreatorProfile.findByIdAndUpdate(creatorId, { $set: allowed }, { new: true, runValidators: true });
  return publicProfile(profile);
};

const syncCreatorFollowerCount = async (profile) => {
  const followerCount = Math.max(0, Number(await UserFollow.countDocuments(creatorFollowFilter(null, profile))) || 0);
  await CreatorProfile.updateOne({ _id: profile._id }, { $set: { "metrics.followerCount": followerCount } });
  return followerCount;
};

const followCreator = async (followerId, profile) => {
  if (isCreatorOwner(profile, followerId)) {
    throw Object.assign(new Error("You cannot follow your own Creator profile."), { status: 403, code: "CREATOR_SELF_FOLLOW_FORBIDDEN" });
  }
  const filter = creatorFollowFilter(followerId, profile);
  try {
    await UserFollow.updateOne(filter, { $setOnInsert: filter }, { upsert: true, runValidators: true });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  return { following: true, followerCount: await syncCreatorFollowerCount(profile) };
};

const unfollowCreator = async (followerId, profile) => {
  await UserFollow.deleteOne(creatorFollowFilter(followerId, profile));
  return { following: false, followerCount: await syncCreatorFollowerCount(profile) };
};

const updateFeaturedContent = async (creatorId, input) => {
  const requested = Array.isArray(input) ? input : [];
  if (requested.length > 6) throw Object.assign(new Error("Choose no more than six featured items."), { status: 422, code: "FEATURED_CONTENT_LIMIT" });
  const normalized = [];
  for (const item of requested) {
    const contentType = String(item?.contentType || "");
    const contentId = item?.contentId;
    const config = FEATURE_CONFIG[contentType];
    if (!config || !mongoose.isValidObjectId(contentId)) throw Object.assign(new Error("Choose a valid published Creator item."), { status: 422, code: "INVALID_FEATURED_CONTENT" });
    if (normalized.some((entry) => entry.contentType === contentType && String(entry.contentId) === String(contentId))) continue;
    const exists = await config.Model.exists({ _id: contentId, [config.owner]: creatorId, ...config.filter });
    if (!exists) throw Object.assign(new Error("Only your own published content can be featured."), { status: 403, code: "FEATURED_CONTENT_NOT_OWNED" });
    normalized.push({ contentType, contentId });
  }
  const profile = await CreatorProfile.findByIdAndUpdate(creatorId, { $set: { featuredContent: normalized } }, { new: true, runValidators: true });
  return publicProfile(profile);
};

module.exports = { followCreator, getCapability, getCreatorFollowState, getPublicProfile, listCreators, publicProfile, unfollowCreator, updateFeaturedContent, updateOwnProfile };
