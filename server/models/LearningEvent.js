const mongoose = require("mongoose");

const LearningEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson", default: null, index: true },
  eventType: { type: String, enum: ["enrolled", "course_started", "lesson_started", "lesson_resumed", "lesson_completed", "course_completed"], required: true, index: true },
  idempotencyKey: { type: String, required: true, maxlength: 120 },
  positionSeconds: { type: Number, default: 0, min: 0 },
  entitlementPlan: { type: String, enum: ["free", "premium"], required: true },
  occurredAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

LearningEventSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
LearningEventSchema.index({ userId: 1, courseId: 1, occurredAt: -1 });

module.exports = mongoose.model("LearningEvent", LearningEventSchema);
