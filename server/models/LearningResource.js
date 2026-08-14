const mongoose = require("mongoose");
const { ACCESS_LEVELS, PUBLICATION_STATUSES } = require("../learn/constants");
const { CREATOR_WORKFLOW_STATUSES } = require("../creators/constants");

const LearningResourceSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 2000 },
  resourceType: { type: String, enum: ["pdf", "document", "spreadsheet", "slides", "code_archive", "image", "file", "external"], required: true, index: true },
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic", index: true }],
  language: { type: String, default: "English", index: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "ProtectedMediaAsset", default: null, select: false },
  externalUrl: { type: String, default: "", select: false },
  sizeBytes: { type: Number, default: 0, min: 0 },
  accessLevel: { type: String, enum: ACCESS_LEVELS, default: "free", index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null, index: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson", default: null, index: true },
  publicationStatus: { type: String, enum: PUBLICATION_STATUSES, default: "draft", index: true },
  workflowStatus: { type: String, enum: CREATOR_WORKFLOW_STATUSES, default: "draft", index: true },
  rightsConfirmedAt: { type: Date, required: true },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

LearningResourceSchema.pre("validate", function validatePremiumExternal(next) {
  if (this.accessLevel === "premium" && this.externalUrl) return next(new Error("Premium resources require protected media delivery."));
  if (!this.assetId && !this.externalUrl) return next(new Error("A resource asset or external URL is required."));
  return next();
});
LearningResourceSchema.index({ publicationStatus: 1, accessLevel: 1, publishedAt: -1 });
LearningResourceSchema.index({ creatorId: 1, workflowStatus: 1, updatedAt: -1 });

module.exports = mongoose.model("LearningResource", LearningResourceSchema);
