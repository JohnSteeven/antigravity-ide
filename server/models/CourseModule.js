const mongoose = require("mongoose");

const CourseModuleSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: "", maxlength: 1200 },
  order: { type: Number, required: true, min: 0 },
  stableKey: { type: String, required: true, immutable: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

CourseModuleSchema.index({ courseId: 1, order: 1 }, { unique: true, partialFilterExpression: { isDeleted: false }, name: "course_module_order_unique" });

module.exports = mongoose.model("CourseModule", CourseModuleSchema);
