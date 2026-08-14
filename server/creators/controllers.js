const CreatorApplication = require("../models/CreatorApplication");
const CreatorProfile = require("../models/CreatorProfile");
const CreatorReviewEvent = require("../models/CreatorReviewEvent");
const applicationService = require("./applicationService");
const directoryService = require("./directoryService");
const studioService = require("./studioService");

const userId = (req) => req.user?._id || req.user?.id;
const sendError = (error, next) => error.status ? next(error) : next(error);

exports.apply = async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(userId(req), req.body, req);
    return res.status(201).json({ success: true, data: application });
  } catch (error) { return sendError(error, next); }
};

exports.getMyApplication = async (req, res, next) => {
  try {
    const application = await CreatorApplication.findOne({ userId: userId(req) }).lean();
    return res.set("Cache-Control", "private, no-store").json({ success: true, data: applicationService.publicApplication(application) });
  } catch (error) { return next(error); }
};

exports.updateMyApplication = async (req, res, next) => {
  try {
    const application = await applicationService.updateRequestedInformation(userId(req), req.body, req);
    return res.json({ success: true, data: application });
  } catch (error) { return next(error); }
};

exports.getCapability = async (req, res, next) => {
  try {
    return res.set("Cache-Control", "private, no-store").json({ success: true, data: await directoryService.getCapability(userId(req)) });
  } catch (error) { return next(error); }
};

exports.listCreators = async (req, res, next) => {
  try { return res.json({ success: true, ...(await directoryService.listCreators(req.query)) }); }
  catch (error) { return next(error); }
};

exports.getCreator = async (req, res, next) => {
  try {
    const creator = await directoryService.getPublicProfile(req.params.slug);
    if (!creator) return res.status(404).json({ message: "Creator not found." });
    return res.json({ success: true, data: creator });
  } catch (error) { return next(error); }
};

exports.followCreator = async (req, res, next) => {
  try {
    const creator = await CreatorProfile.findOne({ slug: req.params.slug, status: "active" });
    if (!creator) return res.status(404).json({ message: "Creator not found." });
    return res.json({ success: true, data: await directoryService.toggleFollow(userId(req), creator) });
  } catch (error) { return next(error); }
};

exports.listApplications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = req.query.status ? { status: req.query.status } : {};
    const [items, total] = await Promise.all([
      CreatorApplication.find(filter).select("+legalName +country +yearsExperience +professionalBackground +portfolioLinks +workSamples +supportingDocuments +motivation +termsAcceptedAt +contentRightsAcceptedAt +reviewedBy +privateReviewNotes").sort({ submittedAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      CreatorApplication.countDocuments(filter),
    ]);
    return res.set("Cache-Control", "private, no-store").json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
};

exports.getApplicationReview = async (req, res, next) => {
  try {
    const [application, history] = await Promise.all([
      CreatorApplication.findById(req.params.id).select("+legalName +country +yearsExperience +professionalBackground +portfolioLinks +workSamples +supportingDocuments +motivation +termsAcceptedAt +contentRightsAcceptedAt +reviewedBy +privateReviewNotes").lean(),
      CreatorReviewEvent.find({ applicationId: req.params.id }).select("+privateNote").sort({ occurredAt: 1 }).lean(),
    ]);
    if (!application) return res.status(404).json({ message: "Creator application not found." });
    return res.set("Cache-Control", "private, no-store").json({ success: true, data: { application, history } });
  } catch (error) { return next(error); }
};

exports.reviewApplication = async (req, res, next) => {
  try {
    const result = await applicationService.reviewApplication({
      applicationId: req.params.id,
      nextStatus: req.body.status,
      actorId: userId(req),
      publicMessage: req.body.publicMessage,
      privateNote: req.body.privateNote,
      req,
    });
    return res.json({ success: true, data: result });
  } catch (error) { return next(error); }
};

exports.reviewContent = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await studioService.reviewContent({
      contentType: req.params.contentType,
      contentId: req.params.contentId,
      nextStatus: req.body.status,
      reviewerId: userId(req),
      message: req.body.message,
    }) });
  } catch (error) { return next(error); }
};

exports.listContentReview = async (req, res, next) => {
  try { return res.set("Cache-Control", "private, no-store").json({ success: true, ...(await studioService.listAdminReviewContent(req.query)) }); }
  catch (error) { return next(error); }
};
