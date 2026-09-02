const CreatorApplication = require("../models/CreatorApplication");
const CreatorProfile = require("../models/CreatorProfile");
const CreatorReviewEvent = require("../models/CreatorReviewEvent");
const Notification = require("../models/Notification");
const AuditLogger = require("../audit/AuditLogger");
const { APPLICATION_TRANSITIONS } = require("./constants");
const { safePublicLinks, slugify, uniqueStrings } = require("./utils");

const errorWith = (message, status, code) => Object.assign(new Error(message), { status, code });

const findAvailableSlug = async (displayName, excludeId = null) => {
  const base = slugify(displayName) || "creator";
  let candidate = base;
  let suffix = 1;
  while (await CreatorProfile.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const publicApplication = (application) => {
  if (!application) return null;
  const source = application.toObject ? application.toObject() : { ...application };
  ["legalName", "country", "yearsExperience", "professionalBackground", "portfolioLinks", "workSamples", "supportingDocuments", "motivation", "termsAcceptedAt", "contentRightsAcceptedAt", "reviewedBy", "privateReviewNotes"].forEach((field) => delete source[field]);
  return source;
};

const buildApplicationInput = (input, userId) => ({
  userId,
  legalName: String(input.legalName || "").trim(),
  displayName: String(input.displayName || "").trim(),
  headline: String(input.headline || "").trim(),
  biography: String(input.biography || "").trim(),
  country: String(input.country || "").trim(),
  languages: uniqueStrings(input.languages, 12),
  specialties: uniqueStrings(input.specialties, 20),
  yearsExperience: Number(input.yearsExperience || 0),
  professionalBackground: String(input.professionalBackground || "").trim(),
  creatorTypes: uniqueStrings(input.creatorTypes, 12),
  intendedTopics: uniqueStrings(input.intendedTopics, 20),
  intendedFormats: uniqueStrings(input.intendedFormats, 12),
  portfolioLinks: safePublicLinks(input.portfolioLinks),
  workSamples: safePublicLinks(input.workSamples),
  motivation: String(input.motivation || "").trim(),
  termsAcceptedAt: input.acceptTerms === true ? new Date() : null,
  contentRightsAcceptedAt: input.confirmContentRights === true ? new Date() : null,
});

const createApplication = async (userId, input, req = null) => {
  const existing = await CreatorApplication.findOne({ userId }).lean();
  if (existing) throw errorWith("A Creator application already exists for this account.", 409, "CREATOR_APPLICATION_EXISTS");
  const application = await CreatorApplication.create(buildApplicationInput(input, userId));
  AuditLogger.log({ entity: "creator_application", entityId: application._id, action: "apply", userId, req, details: "Creator application submitted" });
  return publicApplication(application);
};

const updateRequestedInformation = async (userId, input, req = null) => {
  const application = await CreatorApplication.findOne({ userId }).select("+legalName +country +yearsExperience +professionalBackground +portfolioLinks +workSamples +supportingDocuments +motivation +termsAcceptedAt +contentRightsAcceptedAt");
  if (!application) throw errorWith("Creator application not found.", 404, "CREATOR_APPLICATION_NOT_FOUND");
  if (application.status !== "more_info_required") throw errorWith("This application is not awaiting additional information.", 409, "CREATOR_APPLICATION_NOT_EDITABLE");
  const update = buildApplicationInput({ ...application.toObject(), ...input, acceptTerms: true, confirmContentRights: true }, userId);
  ["userId", "termsAcceptedAt", "contentRightsAcceptedAt"].forEach((field) => delete update[field]);
  Object.assign(application, update, { status: "applied", submittedAt: new Date(), applicantMessage: "" });
  await application.save();
  AuditLogger.log({ entity: "creator_application", entityId: application._id, action: "resubmit", userId, req, details: "Creator application information resubmitted" });
  return publicApplication(application);
};

const reviewApplication = async ({ applicationId, nextStatus, actorId, publicMessage = "", privateNote = "", req = null }) => {
  const application = await CreatorApplication.findById(applicationId).select("+reviewedBy +privateReviewNotes");
  if (!application) throw errorWith("Creator application not found.", 404, "CREATOR_APPLICATION_NOT_FOUND");
  const allowed = APPLICATION_TRANSITIONS[application.status] || [];
  if (!allowed.includes(nextStatus)) throw errorWith(`Cannot move Creator application from ${application.status} to ${nextStatus}.`, 409, "INVALID_CREATOR_TRANSITION");
  const previousStatus = application.status;
  application.status = nextStatus;
  application.reviewedAt = new Date();
  application.reviewedBy = actorId;
  application.privateReviewNotes = String(privateNote || "").slice(0, 5000);
  application.applicantMessage = String(publicMessage || "").slice(0, 2000);
  await application.save();

  await CreatorReviewEvent.create({
    applicationId: application._id,
    actorId,
    fromStatus: previousStatus,
    toStatus: nextStatus,
    publicMessage: application.applicantMessage,
    privateNote: application.privateReviewNotes,
  });

  let profile = await CreatorProfile.findOne({ applicationId: application._id });
  if (nextStatus === "approved" && !profile) {
    profile = await CreatorProfile.create({
      userId: application.userId,
      applicationId: application._id,
      slug: await findAvailableSlug(application.displayName),
      displayName: application.displayName,
      headline: application.headline,
      biography: application.biography,
      specialties: application.specialties,
      languages: application.languages,
      creatorTypes: application.creatorTypes,
      status: "approved",
      verifiedAt: new Date(),
      verifiedBy: actorId,
    });
  } else if (["active", "restricted", "suspended", "deactivated"].includes(nextStatus)) {
    if (!profile) throw errorWith("Approve the Creator before changing activation status.", 409, "CREATOR_PROFILE_NOT_APPROVED");
    profile.status = nextStatus;
    profile.deactivatedAt = nextStatus === "deactivated" ? new Date() : null;
    await profile.save();
  }

  AuditLogger.log({ entity: "creator_application", entityId: application._id, action: nextStatus, userId: actorId, req, details: `Creator application moved from ${previousStatus} to ${nextStatus}` });
  await Notification.create({
    user: application.userId,
    title: nextStatus === "active" ? "Creator Studio is ready" : `Creator application: ${nextStatus.replaceAll("_", " ")}`,
    message: application.applicantMessage || (nextStatus === "active" ? "Your reviewed Creator profile is active. You can now open Creator Studio." : `Your Creator application moved to ${nextStatus.replaceAll("_", " ")}.`),
    type: "creator_application",
    source: "site",
    sourceId: application._id,
  }).catch(() => null);
  return { application, profile };
};

module.exports = {
  createApplication,
  findAvailableSlug,
  publicApplication,
  reviewApplication,
  updateRequestedInformation,
};
