const crypto = require("crypto");
const mongoose = require("mongoose");
const { LESSON_TYPES } = require("../learn/constants");

const CaptionSchema = new mongoose.Schema({
  language: { type: String, required: true, maxlength: 60 },
  label: { type: String, default: "", maxlength: 100 },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "ProtectedMediaAsset", required: true },
}, { _id: false });

const CourseLessonSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseModule", required: true, index: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  stableKey: { type: String, default: () => crypto.randomUUID(), immutable: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: "", maxlength: 1200 },
  lessonType: { type: String, enum: LESSON_TYPES, required: true },
  body: { type: String, default: "", select: false },
  mediaAssetId: { type: mongoose.Schema.Types.ObjectId, ref: "ProtectedMediaAsset", default: null, select: false },
  transcript: { type: String, default: "", select: false },
  captions: { type: [CaptionSchema], default: [], select: false },
  resourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "LearningResource", select: false }],
  durationSeconds: { type: Number, default: 0, min: 0, max: 86400 },
  order: { type: Number, required: true, min: 0 },
  isPreview: { type: Boolean, default: false },
  completionMode: { type: String, enum: ["manual", "consume", "resource"], default: "manual" },
  contentVersion: { type: Number, default: 1, min: 1 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

CourseLessonSchema.index({ moduleId: 1, order: 1 }, { unique: true, partialFilterExpression: { isDeleted: false }, name: "course_lesson_order_unique" });
CourseLessonSchema.index({ courseId: 1, isDeleted: 1, moduleId: 1, order: 1 });

module.exports = mongoose.model("CourseLesson", CourseLessonSchema);
