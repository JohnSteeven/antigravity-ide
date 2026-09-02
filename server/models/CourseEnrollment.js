const mongoose = require("mongoose");

const LessonProgressSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson", required: true },
  lessonStableKey: { type: String, required: true },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  positionSeconds: { type: Number, default: 0, min: 0 },
  lastActivityAt: { type: Date, default: Date.now },
  lessonContentVersion: { type: Number, default: 1 },
}, { _id: false });

const CourseEnrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  status: { type: String, enum: ["active", "completed", "archived"], default: "active", index: true },
  startedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now, index: true },
  completedAt: { type: Date, default: null },
  currentLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson", default: null },
  structuralVersionAtEnrollment: { type: Number, required: true },
  lessonProgress: { type: [LessonProgressSchema], default: [] },
  completedLessonCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

CourseEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CourseEnrollmentSchema.index({ userId: 1, status: 1, lastActivityAt: -1 });

module.exports = mongoose.model("CourseEnrollment", CourseEnrollmentSchema);
