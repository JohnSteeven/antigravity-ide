const crypto = require("crypto");
const mongoose = require("mongoose");
const { LESSON_TYPES } = require("../learn/constants");

const CaptionSchema = new mongoose.Schema({
  language: { type: String, required: true, maxlength: 60 },
  label: { type: String, default: "", maxlength: 100 },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "ProtectedMediaAsset", required: true },
}, { _id: false });

const CodingTestAssertionSchema = new mongoose.Schema({
  description: { type: String, default: "", maxlength: 300 },
  testCode: { type: String, default: "", maxlength: 5000 },
  hidden: { type: Boolean, default: false },
}, { _id: false });

const CodingBlockSchema = new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID() },
  blockType: {
    type: String,
    enum: [
      "explanation",
      "example",
      "starter_code",
      "instructions",
      "expected_output",
      "hints",
      "solution",
      "tests",
      "project_task",
    ],
    default: "explanation",
  },
  title: { type: String, default: "", maxlength: 180 },
  content: { type: String, default: "", maxlength: 10000 },
  language: { type: String, default: "javascript", maxlength: 40 },
  starterCode: { type: String, default: "", maxlength: 20000 },
  instructions: { type: String, default: "", maxlength: 5000 },
  expectedOutput: { type: String, default: "", maxlength: 5000 },
  hints: [{ type: String, maxlength: 1000 }],
  validationRules: { type: mongoose.Schema.Types.Mixed, default: null },
  // Protected fields for educator / grading only — excluded by default
  solutionCode: { type: String, default: "", maxlength: 20000, select: false },
  tests: { type: [CodingTestAssertionSchema], default: [], select: false },
  order: { type: Number, default: 0 },
}, { _id: false });

const QuizOptionSchema = new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID() },
  text: { type: String, required: true, maxlength: 500 },
}, { _id: false });

const QuizQuestionSchema = new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID() },
  question: { type: String, required: true, maxlength: 1000 },
  options: {
    type: [QuizOptionSchema],
    validate: [val => !val || (val.length >= 2 && val.length <= 6), "Must provide between 2 and 6 options."],
  },
  explanation: { type: String, default: "", maxlength: 2000 },
  // Protected answer field — excluded by default from ordinary learner API responses
  correctOptionIndex: { type: Number, required: true, min: 0, select: false },
  order: { type: Number, default: 0 },
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
  codingBlocks: { type: [CodingBlockSchema], default: [] },
  quizQuestions: { type: [QuizQuestionSchema], default: [] },
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
