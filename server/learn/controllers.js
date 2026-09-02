const mongoose = require("mongoose");
const Course = require("../models/Course");
const CreatorVideo = require("../models/CreatorVideo");
const ExamDefinition = require("../models/ExamDefinition");
const LearningResource = require("../models/LearningResource");
const PodcastEpisode = require("../models/PodcastEpisode");
const Topic = require("../models/Topic");
const Article = require("../models/Article");
const CourseLesson = require("../models/CourseLesson");
const ContentReport = require("../models/ContentReport");
const courseService = require("./courseService");
const mediaService = require("./mediaService");
const MediaProvider = require("./mediaProviderService");
const engagementService = require("../creators/engagementService");
const directoryService = require("../creators/directoryService");
const { escapeRegex, slugify } = require("../creators/utils");

const userId = (req) => req.user?._id || req.user?.id || null;

exports.home = async (req, res, next) => {
  try {
    const [topics, courses, videos, podcasts, resources, exams, continueItems] = await Promise.all([
      Topic.find({ status: "active" }).sort({ sortOrder: 1, name: 1 }).limit(18).lean(),
      courseService.listCourses({ limit: 8 }),
      mediaService.listVideos({ limit: 6 }),
      mediaService.listPodcasts({ limit: 6 }),
      mediaService.listResources({ limit: 6 }),
      ExamDefinition.find({ status: "published" }).select("title slug description examCategory subjectLabels accessLevel").sort({ publishedAt: -1 }).limit(6).lean(),
      req.user ? courseService.continueLearning(userId(req), 8) : [],
    ]);
    return res.set("Cache-Control", req.user ? "private, no-store" : "public, max-age=60").json({
      success: true,
      data: { topics, courses: courses.courses, videos: videos.items, podcasts: podcasts.items, resources: resources.items, exams, continueLearning: continueItems },
    });
  } catch (error) { return next(error); }
};

exports.listTopics = async (req, res, next) => {
  try { return res.json({ success: true, data: await Topic.find({ status: "active" }).sort({ sortOrder: 1, name: 1 }).limit(200).lean() }); }
  catch (error) { return next(error); }
};

exports.listAdminTopics = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await Topic.find({}).sort({ sortOrder: 1, name: 1 }).limit(500).lean() }); }
  catch (error) { return next(error); }
};

exports.search = async (req, res, next) => {
  try {
    const search = String(req.query.q || "").trim().slice(0, 100);
    if (search.length < 2) return res.status(422).json({ message: "Search needs at least two characters.", code: "LEARN_SEARCH_TOO_SHORT" });
    const [courses, videos, podcasts, resources, creators, topics] = await Promise.all([
      courseService.listCourses({ search, limit: 5 }),
      mediaService.listVideos({ search, limit: 5 }),
      mediaService.listPodcasts({ search, limit: 5 }),
      mediaService.listResources({ search, limit: 5 }),
      directoryService.listCreators({ search, limit: 5 }),
      Topic.find({ status: "active", $or: [{ name: new RegExp(escapeRegex(search), "i") }, { description: new RegExp(escapeRegex(search), "i") }] }).select("name slug description icon").sort({ sortOrder: 1, name: 1 }).limit(5).lean(),
    ]);
    return res.set("Cache-Control", "public, max-age=30").json({ success: true, data: { courses: courses.courses, videos: videos.items, podcasts: podcasts.items, resources: resources.items, creators: creators.creators, topics } });
  } catch (error) { return next(error); }
};

exports.createTopic = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2 || name.length > 100) return res.status(422).json({ message: "Topic name must be 2–100 characters.", code: "INVALID_TOPIC_NAME" });
    const status = ["draft", "active", "archived"].includes(req.body.status) ? req.body.status : "active";
    if (req.body.parentId && !mongoose.isValidObjectId(req.body.parentId)) return res.status(422).json({ message: "Choose a valid parent Topic.", code: "INVALID_PARENT_TOPIC" });
    const topic = await Topic.create({ name, slug: slugify(req.body.slug || name), description: String(req.body.description || "").trim(), parentId: req.body.parentId || null, status, sortOrder: Number(req.body.sortOrder || 0), icon: String(req.body.icon || "book"), createdBy: userId(req), updatedBy: userId(req) });
    return res.status(201).json({ success: true, data: topic });
  } catch (error) { return next(error); }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: "Topic not found.", code: "TOPIC_NOT_FOUND" });
    if (req.body.status !== undefined && !["draft", "active", "archived"].includes(req.body.status)) return res.status(422).json({ message: "Choose a valid Topic status.", code: "INVALID_TOPIC_STATUS" });
    if (req.body.parentId && !mongoose.isValidObjectId(req.body.parentId)) return res.status(422).json({ message: "Choose a valid parent Topic.", code: "INVALID_PARENT_TOPIC" });
    ["name", "description", "parentId", "status", "sortOrder", "icon"].forEach((field) => { if (req.body[field] !== undefined) topic[field] = req.body[field]; });
    if (req.body.slug !== undefined || req.body.name !== undefined) topic.slug = slugify(req.body.slug || topic.name);
    topic.updatedBy = userId(req);
    await topic.save();
    return res.json({ success: true, data: topic });
  } catch (error) { return next(error); }
};

exports.listCourses = async (req, res, next) => {
  try { return res.json({ success: true, ...(await courseService.listCourses(req.query)) }); }
  catch (error) { return next(error); }
};

exports.getCourse = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await courseService.getCourseDetail(req.params.slug, userId(req)) }); }
  catch (error) { return next(error); }
};

exports.getLesson = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await courseService.getLesson({ courseSlug: req.params.slug, lessonId: req.params.lessonId, userId: userId(req) }) }); }
  catch (error) { return next(error); }
};

exports.enroll = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await courseService.enroll(userId(req), req.params.courseId) }); }
  catch (error) { return next(error); }
};

exports.progress = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await courseService.recordProgress({
      userId: userId(req),
      courseId: req.params.courseId,
      lessonId: req.body.lessonId,
      positionSeconds: req.body.positionSeconds,
      completed: req.body.completed === true,
      idempotencyKey: req.body.idempotencyKey,
    }) });
  } catch (error) { return next(error); }
};

exports.continueLearning = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await courseService.continueLearning(userId(req), req.query.limit) }); }
  catch (error) { return next(error); }
};

exports.listVideos = async (req, res, next) => { try { return res.json({ success: true, ...(await mediaService.listVideos(req.query)) }); } catch (error) { return next(error); } };
exports.getVideo = async (req, res, next) => { try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await mediaService.getVideo(req.params.slug, userId(req)) }); } catch (error) { return next(error); } };
exports.listPodcasts = async (req, res, next) => { try { return res.json({ success: true, ...(await mediaService.listPodcasts(req.query)) }); } catch (error) { return next(error); } };
exports.getPodcast = async (req, res, next) => { try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await mediaService.getPodcast(req.params.slug, userId(req)) }); } catch (error) { return next(error); } };
exports.listResources = async (req, res, next) => { try { return res.json({ success: true, ...(await mediaService.listResources(req.query)) }); } catch (error) { return next(error); } };
exports.getResource = async (req, res, next) => { try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await mediaService.getResource(req.params.slug, userId(req)) }); } catch (error) { return next(error); } };

exports.mediaCapability = async (req, res) => res.json({ success: true, data: MediaProvider.capability() });
exports.assetAccess = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await mediaService.issueAssetAccess({ assetId: req.params.assetId, userId: userId(req), purpose: req.query.purpose }) }); }
  catch (error) { return next(error); }
};

exports.listExams = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 18));
    const filter = { status: "published" };
    if (req.query.category) filter.examCategory = req.query.category;
    const [items, total] = await Promise.all([
      ExamDefinition.find(filter).select("title slug description examCategory jurisdiction subjectLabels accessLevel publishedAt").sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ExamDefinition.countDocuments(filter),
    ]);
    return res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, assessmentEngineAvailable: false });
  } catch (error) { return next(error); }
};

exports.recordEngagement = async (req, res, next) => {
  try { return res.status(202).json({ success: true, data: await engagementService.recordEngagement({ userId: userId(req), input: req.body }) }); }
  catch (error) { return next(error); }
};

const REPORT_TARGETS = {
  article: { Model: Article, extra: { contentType: { $ne: "story" } } },
  story: { Model: Article, extra: { contentType: "story" } },
  course: { Model: Course, extra: {} },
  lesson: { Model: CourseLesson, extra: {} },
  video: { Model: CreatorVideo, extra: {} },
  podcast: { Model: PodcastEpisode, extra: {} },
  resource: { Model: LearningResource, extra: {} },
};

exports.reportContent = async (req, res, next) => {
  try {
    const config = REPORT_TARGETS[req.body.targetType];
    const reasons = ["spam", "harassment", "copyright", "dangerous", "misleading", "privacy", "other"];
    if (!config || !reasons.includes(req.body.reason)) return res.status(422).json({ message: "Choose a valid report target and reason.", code: "INVALID_CONTENT_REPORT" });
    if (!mongoose.isValidObjectId(req.body.targetId)) return res.status(422).json({ message: "Choose a valid content item to report.", code: "INVALID_REPORT_TARGET" });
    const exists = await config.Model.exists({ _id: req.body.targetId, ...config.extra });
    if (!exists) return res.status(404).json({ message: "Reported content was not found.", code: "REPORT_TARGET_NOT_FOUND" });
    const report = await ContentReport.create({ reporterId: userId(req), targetType: req.body.targetType, targetId: req.body.targetId, reason: req.body.reason, details: String(req.body.details || "").trim().slice(0, 2000) });
    return res.status(201).json({ success: true, data: { id: String(report._id), status: report.status } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You already have an open report for this content.", code: "CONTENT_REPORT_EXISTS" });
    return next(error);
  }
};

exports.listContentReports = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = req.query.status ? { status: req.query.status } : { status: { $in: ["pending", "reviewing"] } };
    const [items, total] = await Promise.all([
      ContentReport.find(filter).select("+details +reporterId +reviewedBy +privateResolutionNote").populate("reporterId", "name email").sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContentReport.countDocuments(filter),
    ]);
    return res.set("Cache-Control", "private, no-store").json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
};

exports.reviewContentReport = async (req, res, next) => {
  try {
    if (!["reviewing", "resolved", "dismissed"].includes(req.body.status)) return res.status(422).json({ message: "Choose a valid report status.", code: "INVALID_REPORT_STATUS" });
    const report = await ContentReport.findById(req.params.id).select("+privateResolutionNote +reviewedBy");
    if (!report) return res.status(404).json({ message: "Content report not found.", code: "CONTENT_REPORT_NOT_FOUND" });
    report.status = req.body.status;
    report.reviewedBy = userId(req);
    report.reviewedAt = new Date();
    report.privateResolutionNote = String(req.body.privateResolutionNote || "").trim().slice(0, 4000);
    await report.save();
    return res.json({ success: true, data: { id: String(report._id), status: report.status } });
  } catch (error) { return next(error); }
};

// Referenced so static contract tests can verify format-specific models remain separate.
exports.models = { Course, CreatorVideo, PodcastEpisode, LearningResource };
