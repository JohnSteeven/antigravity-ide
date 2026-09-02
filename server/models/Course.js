const mongoose = require("mongoose");
const { ACCESS_LEVELS, COURSE_LEVELS, PUBLICATION_STATUSES } = require("../learn/constants");
const { CREATOR_WORKFLOW_STATUSES } = require("../creators/constants");

const CourseSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subtitle: { type: String, default: "", maxlength: 240 },
  description: { type: String, required: true, maxlength: 5000 },
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic", index: true }],
  language: { type: String, required: true, trim: true, maxlength: 60, index: true },
  level: { type: String, enum: COURSE_LEVELS, default: "all_levels", index: true },
  accessLevel: { type: String, enum: ACCESS_LEVELS, default: "free", index: true },
  coverImage: { type: String, default: "" },
  coverImageAlt: { type: String, default: "", maxlength: 240 },
  estimatedDurationMinutes: { type: Number, default: 0, min: 0, max: 100000 },
  learningOutcomes: { type: [String], default: [] },
  prerequisites: { type: [String], default: [] },
  publicationStatus: { type: String, enum: PUBLICATION_STATUSES, default: "draft", index: true },
  workflowStatus: { type: String, enum: CREATOR_WORKFLOW_STATUSES, default: "draft", index: true },
  rightsConfirmedAt: { type: Date, required: true },
  contentVersion: { type: Number, default: 1, min: 1 },
  structuralVersion: { type: Number, default: 1, min: 1 },
  moduleCount: { type: Number, default: 0, min: 0 },
  lessonCount: { type: Number, default: 0, min: 0 },
  publishedAt: { type: Date, default: null, index: true },
  scheduledAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reviewMessage: { type: String, default: "", maxlength: 2000 },
  isFeatured: { type: Boolean, default: false, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

CourseSchema.index({ publicationStatus: 1, accessLevel: 1, publishedAt: -1 });
CourseSchema.index({ creatorId: 1, workflowStatus: 1, updatedAt: -1 });
CourseSchema.index({ topicIds: 1, publicationStatus: 1, publishedAt: -1 });
CourseSchema.index({ title: "text", subtitle: "text", description: "text" });

module.exports = mongoose.model("Course", CourseSchema);
