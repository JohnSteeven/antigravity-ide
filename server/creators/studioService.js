const Article = require("../models/Article");
const Course = require("../models/Course");
const CreatorVideo = require("../models/CreatorVideo");
const LearningResource = require("../models/LearningResource");
const PodcastEpisode = require("../models/PodcastEpisode");
const MediaProvider = require("../learn/mediaProviderService");
const CreatorProfile = require("../models/CreatorProfile");
const Notification = require("../models/Notification");
const articleService = require("../services/articleService");
const { prepareStory } = require("../controllers/storyController");
const { CREATOR_CONTENT_TYPES, CREATOR_WORKFLOW_STATUSES, RECOMMENDED_STORY_LAYOUTS } = require("./constants");
const { slugify, uniqueStrings } = require("./utils");

const errorWith = (message, status, code) => Object.assign(new Error(message), { status, code });
const isEditable = (status) => ["draft", "changes_requested"].includes(status);

const MODEL_CONFIG = Object.freeze({
  article: { Model: Article, ownerField: "creatorProfileId", workflowField: "creatorWorkflowStatus", publicationField: "status", extra: { contentType: "article" } },
  story: { Model: Article, ownerField: "creatorProfileId", workflowField: "creatorWorkflowStatus", publicationField: "status", extra: { contentType: "story" } },
  course: { Model: Course, ownerField: "creatorId", workflowField: "workflowStatus", publicationField: "publicationStatus", extra: {} },
  video: { Model: CreatorVideo, ownerField: "creatorId", workflowField: "workflowStatus", publicationField: "publicationStatus", extra: {} },
  podcast: { Model: PodcastEpisode, ownerField: "creatorId", workflowField: "workflowStatus", publicationField: "publicationStatus", extra: {} },
  resource: { Model: LearningResource, ownerField: "creatorId", workflowField: "workflowStatus", publicationField: "publicationStatus", extra: {} },
});

const configFor = (contentType) => {
  const config = MODEL_CONFIG[contentType];
  if (!config) throw errorWith("Unsupported Creator content type.", 422, "UNSUPPORTED_CREATOR_CONTENT");
  return config;
};

const createArticle = async (creator, user, input) => {
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this Article.", 422, "CONTENT_RIGHTS_REQUIRED");
  return articleService.createArticle({
    title: String(input.title || "").trim(),
    slug: slugify(input.slug || input.title),
    description: String(input.description || "").trim(),
    excerpt: String(input.excerpt || input.description || "").trim().slice(0, 500),
    body: String(input.body || ""),
    coverImage: String(input.coverImage || ""),
    coverImageAlt: String(input.coverImageAlt || ""),
    category: String(input.category || "Life"),
    tags: uniqueStrings(input.tags, 20),
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    authorId: user._id || user.id,
    author: creator.displayName,
    creatorProfileId: creator._id,
    creatorWorkflowStatus: "draft",
    contentRightsConfirmedAt: new Date(),
    contentType: "article",
    status: "draft",
  }, user._id || user.id);
};

const createStory = async (creator, user, input) => {
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this Story.", 422, "CONTENT_RIGHTS_REQUIRED");
  const story = prepareStory({ ...input, status: "draft" });
  return articleService.createArticle({
    ...story,
    description: String(input.description || "").trim(),
    excerpt: String(input.excerpt || input.description || "").trim().slice(0, 500),
    coverImage: String(input.coverImage || ""),
    coverImageAlt: String(input.coverImageAlt || ""),
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    authorId: user._id || user.id,
    author: creator.displayName,
    creatorProfileId: creator._id,
    creatorWorkflowStatus: "draft",
    contentRightsConfirmedAt: new Date(),
  }, user._id || user.id);
};

const updateArticleOrStory = async (creator, user, contentType, contentId, input) => {
  const existing = await Article.findOne({ _id: contentId, creatorProfileId: creator._id, contentType, isDeleted: false }).lean();
  if (!existing) throw errorWith(`${contentType === "story" ? "Story" : "Article"} not found.`, 404, "CREATOR_CONTENT_NOT_FOUND");
  if (!isEditable(existing.creatorWorkflowStatus)) throw errorWith("Submitted content cannot be edited until review is complete.", 409, "CREATOR_CONTENT_NOT_EDITABLE");
  const update = contentType === "story" ? prepareStory(input, existing) : {};
  const common = ["title", "description", "excerpt", "body", "coverImage", "coverImageAlt", "category"];
  common.forEach((field) => { if (input[field] !== undefined) update[field] = input[field]; });
  if (input.tags !== undefined) update.tags = uniqueStrings(input.tags, 20);
  if (input.accessLevel !== undefined) update.accessLevel = input.accessLevel === "premium" ? "premium" : "free";
  update.status = "draft";
  update.creatorContentVersion = Number(existing.creatorContentVersion || 1) + 1;
  return articleService.updateArticle(contentId, update, user._id || user.id);
};

const listContent = async (creatorId, query = {}) => {
  const contentType = query.contentType || "article";
  const config = configFor(contentType);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const filter = { [config.ownerField]: creatorId, ...config.extra };
  if (query.workflowStatus) filter[config.workflowField] = query.workflowStatus;
  const [items, total] = await Promise.all([
    config.Model.find(filter).select("-body -transcript -showNotes -chapters -externalUrl").sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    config.Model.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const previewContent = async (creatorId, contentType, contentId) => {
  const config = configFor(contentType);
  const item = await config.Model.findOne({ _id: contentId, [config.ownerField]: creatorId, ...config.extra })
    .select("+body +transcript +showNotes +chapters +mediaAssetId +assetId +externalUrl")
    .lean();
  if (!item) throw errorWith("Creator content not found.", 404, "CREATOR_CONTENT_NOT_FOUND");
  return item;
};

const overview = async (creatorId) => {
  const statuses = ["draft", "submitted", "under_review", "changes_requested", "approved", "scheduled", "published"];
  const groupedCounts = await Promise.all(Object.values(MODEL_CONFIG).map((config) => config.Model.aggregate([
    { $match: { [config.ownerField]: creatorId, ...config.extra } },
    { $group: { _id: `$${config.workflowField}`, count: { $sum: 1 } } },
  ])));
  const result = Object.fromEntries(statuses.map((status) => [status, 0]));
  groupedCounts.flat().forEach((entry) => { if (result[entry._id] !== undefined) result[entry._id] += entry.count; });
  return { contentStatus: result, recommendedStoryLayouts: RECOMMENDED_STORY_LAYOUTS, supportedContentTypes: CREATOR_CONTENT_TYPES.filter((type) => type !== "series") };
};

const submitContent = async (creator, contentType, contentId) => {
  const config = configFor(contentType);
  const item = await config.Model.findOne({ _id: contentId, [config.ownerField]: creator._id, ...config.extra });
  if (!item) throw errorWith("Creator content not found.", 404, "CREATOR_CONTENT_NOT_FOUND");
  if (!isEditable(item[config.workflowField])) throw errorWith("Content is already in review.", 409, "CREATOR_CONTENT_ALREADY_SUBMITTED");
  if (contentType === "course" && !item.lessonCount) throw errorWith("Add Lessons before submitting this Course.", 422, "COURSE_CURRICULUM_REQUIRED");
  if (["video", "podcast", "resource"].includes(contentType) && !MediaProvider.capability().providerConfigured) throw errorWith("Production media delivery must be configured before this format can enter review.", 503, "MEDIA_PROVIDER_UNAVAILABLE");
  item[config.workflowField] = creator.permissions?.canPublishWithoutReview ? "approved" : "submitted";
  item[config.publicationField] = "draft";
  await item.save();
  return item;
};

const CONTENT_REVIEW_TRANSITIONS = Object.freeze({
  submitted: ["under_review", "changes_requested", "approved", "rejected"],
  under_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["submitted", "rejected"],
  approved: ["scheduled", "published"],
  scheduled: ["published", "archived"],
  published: ["archived"],
  rejected: ["changes_requested"],
  archived: [],
  draft: ["submitted"],
});

const reviewContent = async ({ contentType, contentId, nextStatus, reviewerId, message = "" }) => {
  if (!CREATOR_WORKFLOW_STATUSES.includes(nextStatus)) throw errorWith("Invalid content review status.", 422, "INVALID_CONTENT_REVIEW_STATUS");
  const config = configFor(contentType);
  const item = await config.Model.findOne({ _id: contentId, ...config.extra });
  if (!item) throw errorWith("Creator content not found.", 404, "CREATOR_CONTENT_NOT_FOUND");
  const current = item[config.workflowField];
  if (!(CONTENT_REVIEW_TRANSITIONS[current] || []).includes(nextStatus)) throw errorWith(`Cannot move content from ${current} to ${nextStatus}.`, 409, "INVALID_CONTENT_REVIEW_TRANSITION");
  item[config.workflowField] = nextStatus;
  if (nextStatus === "published") {
    item[config.publicationField] = "published";
    item.publishedAt = item.publishedAt || new Date();
    if (contentType === "podcast") item.isPublished = true;
  } else if (nextStatus === "scheduled") item[config.publicationField] = "scheduled";
  else if (nextStatus === "archived") {
    item[config.publicationField] = "archived";
    if (contentType === "podcast") item.isPublished = false;
  }
  if ("reviewedBy" in item) item.reviewedBy = reviewerId;
  if ("reviewedAt" in item) item.reviewedAt = new Date();
  if ("reviewMessage" in item) item.reviewMessage = String(message).slice(0, 2000);
  await item.save();
  const owner = await CreatorProfile.findById(item[config.ownerField]).select("userId").lean();
  if (owner?.userId) await Notification.create({
    user: owner.userId,
    title: `${contentType[0].toUpperCase()}${contentType.slice(1)} review update`,
    message: String(message || `Your ${contentType} “${item.title}” moved to ${nextStatus.replaceAll("_", " ")}.`).slice(0, 2000),
    type: "creator_content",
    source: "site",
    sourceId: item._id,
  }).catch(() => null);
  return item;
};

const listAdminReviewContent = async (query = {}) => {
  const contentType = query.contentType || "course";
  const config = configFor(contentType);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const filter = { ...config.extra };
  if (query.status) filter[config.workflowField] = query.status;
  else filter[config.workflowField] = { $in: ["submitted", "under_review", "changes_requested", "approved"] };
  const [items, total] = await Promise.all([
    config.Model.find(filter).select("title slug description accessLevel updatedAt publishedAt creatorProfileId creatorId author creatorWorkflowStatus workflowStatus status publicationStatus").populate(config.ownerField, "displayName slug").sort({ updatedAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    config.Model.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

module.exports = { createArticle, createStory, listAdminReviewContent, listContent, overview, previewContent, reviewContent, submitContent, updateArticleOrStory };
