const mongoose = require("mongoose");
const { ACCESS_LEVELS, PUBLICATION_STATUSES } = require("../learn/constants");
const { CREATOR_WORKFLOW_STATUSES } = require("../creators/constants");

const LearningResourceSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", default: null, index: true },
  isSystemOwned: { type: Boolean, default: false, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 2000 },
  resourceType: {
    type: String,
    enum: [
      "pdf",
      "document",
      "spreadsheet",
      "slides",
      "code_archive",
      "image",
      "file",
      "external",
      "worksheet",
      "code_file",
      "zip",
      "link",
      "video_link",
      "text_notes",
    ],
    required: true,
    index: true,
  },
  resourceCategory: {
    type: String,
    enum: [
      "cheat_sheet",
      "course_notes",
      "practice_set",
      "project_file",
      "reference_guide",
      "interview_prep",
      "starter_file",
      "solution_file",
      "general",
    ],
    default: "general",
    index: true,
  },
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic", index: true }],
  language: { type: String, default: "English", index: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "ProtectedMediaAsset", default: null, select: false },
  externalUrl: { type: String, default: "", select: false },
  filename: { type: String, default: "", maxlength: 255 },
  textContent: { type: String, default: "", maxlength: 50000 },
  sizeBytes: { type: Number, default: 0, min: 0 },
  accessLevel: { type: String, enum: ACCESS_LEVELS, default: "free", index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null, index: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseModule", default: null, index: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson", default: null, index: true },
  publicationStatus: { type: String, enum: PUBLICATION_STATUSES, default: "draft", index: true },
  workflowStatus: { type: String, enum: CREATOR_WORKFLOW_STATUSES, default: "draft", index: true },
  rightsConfirmedAt: { type: Date, required: true },
  sortOrder: { type: Number, default: 0 },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

LearningResourceSchema.pre("validate", function validatePremiumExternal(next) {
  if (this.accessLevel === "premium" && this.externalUrl) return next(new Error("Premium resources require protected media delivery."));
  if (!this.assetId && !this.externalUrl && !this.textContent) return next(new Error("A resource asset, external URL, or text body is required."));
  return next();
});
LearningResourceSchema.index({ publicationStatus: 1, accessLevel: 1, publishedAt: -1 });
LearningResourceSchema.index({ creatorId: 1, workflowStatus: 1, updatedAt: -1 });
LearningResourceSchema.index({ courseId: 1, moduleId: 1, lessonId: 1, sortOrder: 1 });

module.exports = mongoose.model("LearningResource", LearningResourceSchema);
