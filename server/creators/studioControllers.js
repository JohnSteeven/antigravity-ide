const courseService = require("../learn/courseService");
const mediaService = require("../learn/mediaService");
const MediaProvider = require("../learn/mediaProviderService");
const resourceStorage = require("../learn/resourceStorageService");
const videoService = require("../learn/videoService");
const directoryService = require("./directoryService");
const studioService = require("./studioService");
const engagementService = require("./engagementService");
const learningEngagementService = require("./learningEngagementService");
const economyService = require("./economyService");

const userId = (req) => req.user?._id || req.user?.id;

exports.overview = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await studioService.overview(req.creator._id) }); }
  catch (error) { return next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try { return res.json({ success: true, data: await directoryService.updateOwnProfile(req.creator._id, req.body) }); }
  catch (error) { return next(error); }
};

exports.updateFeaturedContent = async (req, res, next) => {
  try { return res.json({ success: true, data: await directoryService.updateFeaturedContent(req.creator._id, req.body.items) }); }
  catch (error) { return next(error); }
};

exports.listContent = async (req, res, next) => {
  try { return res.json({ success: true, ...(await studioService.listContent(req.creator._id, req.query)) }); }
  catch (error) { return next(error); }
};

exports.previewContent = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await studioService.previewContent(req.creator._id, req.params.contentType, req.params.contentId) }); }
  catch (error) { return next(error); }
};

exports.createArticle = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await studioService.createArticle(req.creator, req.user, req.body) }); }
  catch (error) { return next(error); }
};

exports.createStory = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await studioService.createStory(req.creator, req.user, req.body) }); }
  catch (error) { return next(error); }
};

exports.updateArticle = async (req, res, next) => {
  try { return res.json({ success: true, data: await studioService.updateArticleOrStory(req.creator, req.user, "article", req.params.id, req.body) }); }
  catch (error) { return next(error); }
};

exports.updateStory = async (req, res, next) => {
  try { return res.json({ success: true, data: await studioService.updateArticleOrStory(req.creator, req.user, "story", req.params.id, req.body) }); }
  catch (error) { return next(error); }
};

exports.submitContent = async (req, res, next) => {
  try { return res.json({ success: true, data: await studioService.submitContent(req.creator, req.params.contentType, req.params.contentId) }); }
  catch (error) { return next(error); }
};

exports.createCourse = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await courseService.createCourse(req.creator, req.body) }); }
  catch (error) { return next(error); }
};

exports.updateCourse = async (req, res, next) => {
  try { return res.json({ success: true, data: await courseService.updateCourse(req.creator._id, req.params.id, req.body) }); }
  catch (error) { return next(error); }
};

exports.replaceCurriculum = async (req, res, next) => {
  try { return res.json({ success: true, data: await courseService.replaceCurriculum(req.creator._id, req.params.id, req.body) }); }
  catch (error) { return next(error); }
};

exports.previewLesson = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await courseService.getLesson({ courseSlug: req.params.slug, lessonId: req.params.lessonId, userId: userId(req), creatorId: req.creator._id }) }); }
  catch (error) { return next(error); }
};

exports.submitCourse = async (req, res, next) => {
  try { return res.json({ success: true, data: await courseService.submitCourse(req.creator._id, req.params.id) }); }
  catch (error) { return next(error); }
};

exports.mediaCapability = async (req, res) => res.json({ success: true, data: MediaProvider.capability() });
exports.createUploadSession = async (req, res, next) => { try { return res.json(await MediaProvider.createUploadSession()); } catch (error) { return next(error); } };
exports.registerAsset = async (req, res, next) => { try { return res.status(201).json({ success: true, data: await mediaService.registerAssetMetadata(req.creator, userId(req), req.body) }); } catch (error) { return next(error); } };
exports.createVideo = async (req, res, next) => { try { return res.status(201).json({ success: true, data: await mediaService.createVideo(req.creator, req.body) }); } catch (error) { return next(error); } };
exports.createPodcastSeries = async (req, res, next) => { try { return res.status(201).json({ success: true, data: await mediaService.createPodcastSeries(req.creator, req.body) }); } catch (error) { return next(error); } };
exports.createPodcastEpisode = async (req, res, next) => { try { return res.status(201).json({ success: true, data: await mediaService.createPodcastEpisode(req.creator, req.body) }); } catch (error) { return next(error); } };
exports.createResource = async (req, res, next) => { try { return res.status(201).json({ success: true, data: await mediaService.createResource(req.creator, req.body) }); } catch (error) { return next(error); } };
exports.uploadCourseResource = async (req, res, next) => {
  try {
    const asset = await resourceStorage.uploadResource({ creatorId: req.creator._id, userId: userId(req), courseId: req.params.id, file: req.file, idempotencyKey: req.get("Idempotency-Key") || "" });
    return res.status(201).json({ success: true, data: { id: asset.id, originalName: asset.originalName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, deliveryStatus: asset.deliveryStatus } });
  } catch (error) { return next(error); }
};
exports.deleteCourseResourceAsset = async (req, res, next) => {
  try { return res.json({ success: true, data: await resourceStorage.deleteUnlinkedAsset({ assetId: req.params.assetId, creatorId: req.creator._id }) }); }
  catch (error) { return next(error); }
};
exports.listCourseVideoLessons = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await videoService.listOwnedLessons({ courseId: req.params.courseId, creatorId: req.creator._id }) }); }
  catch (error) { return next(error); }
};
exports.createCourseVideoUpload = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").status(201).json({ success: true, data: await videoService.initiateUpload({ courseId: req.params.courseId, lessonId: req.params.lessonId, creatorId: req.creator._id, userId: userId(req), input: req.body }) }); }
  catch (error) { return next(error); }
};
exports.courseVideoStatus = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await videoService.getStatus({ courseId: req.params.courseId, lessonId: req.params.lessonId, assetId: req.params.assetId, creatorId: req.creator._id }) }); }
  catch (error) { return next(error); }
};
exports.attachCourseVideo = async (req, res, next) => {
  try { return res.json({ success: true, data: await videoService.attachVideo({ courseId: req.params.courseId, lessonId: req.params.lessonId, assetId: req.body.assetId, creatorId: req.creator._id }) }); }
  catch (error) { return next(error); }
};

exports.analytics = async (req, res, next) => { try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await engagementService.creatorAnalytics(req.creator._id, req.query) }); } catch (error) { return next(error); } };
exports.learningEngagement = async (req, res, next) => { try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await learningEngagementService.reportLearningEngagement({ creatorId: req.creator._id, courseId: req.query.courseId || null, periodStart: req.query.periodStart, periodEnd: req.query.periodEnd }) }); } catch (error) { return next(error); } };
exports.earnings = async (req, res, next) => { try { return res.set("Cache-Control", "private, no-store").json({ success: true, data: await economyService.getCreatorEconomySummary(req.creator._id) }); } catch (error) { return next(error); } };
