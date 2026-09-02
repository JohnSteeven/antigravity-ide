const mongoose = require("mongoose");
const { CREATOR_APPLICATION_STATUSES } = require("../creators/constants");

const LinkSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 80 },
  url: { type: String, trim: true, maxlength: 500 },
}, { _id: false });

const SupportingDocumentSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
  label: { type: String, trim: true, maxlength: 120 },
  verificationPurpose: { type: String, trim: true, maxlength: 160 },
}, { _id: false });

const CreatorApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  status: { type: String, enum: CREATOR_APPLICATION_STATUSES, default: "applied", index: true },
  legalName: { type: String, required: true, trim: true, maxlength: 160, select: false },
  displayName: { type: String, required: true, trim: true, maxlength: 100 },
  headline: { type: String, required: true, trim: true, maxlength: 180 },
  biography: { type: String, required: true, trim: true, maxlength: 3000 },
  country: { type: String, trim: true, maxlength: 100, select: false },
  languages: { type: [String], default: [] },
  specialties: { type: [String], default: [], index: true },
  yearsExperience: { type: Number, min: 0, max: 80, default: 0, select: false },
  professionalBackground: { type: String, trim: true, maxlength: 3000, select: false },
  creatorTypes: { type: [String], default: [] },
  intendedTopics: { type: [String], default: [] },
  intendedFormats: { type: [String], default: [] },
  portfolioLinks: { type: [LinkSchema], default: [], select: false },
  workSamples: { type: [LinkSchema], default: [], select: false },
  supportingDocuments: { type: [SupportingDocumentSchema], default: [], select: false },
  motivation: { type: String, required: true, trim: true, maxlength: 3000, select: false },
  termsAcceptedAt: { type: Date, required: true, select: false },
  contentRightsAcceptedAt: { type: Date, required: true, select: false },
  submittedAt: { type: Date, default: Date.now, index: true },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, select: false },
  privateReviewNotes: { type: String, default: "", maxlength: 5000, select: false },
  applicantMessage: { type: String, default: "", maxlength: 2000 },
}, { timestamps: true });

CreatorApplicationSchema.index({ status: 1, submittedAt: 1 });

module.exports = mongoose.model("CreatorApplication", CreatorApplicationSchema);
