const mongoose = require("mongoose");

const ValidationCheckSchema = new mongoose.Schema({
  description: { type: String, default: "Check", maxlength: 500 },
  passed: { type: Boolean, default: false },
  message: { type: String, default: "", maxlength: 1000 },
}, { _id: false });

const CodingSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson", required: true, index: true },
  blockId: { type: String, default: "", maxlength: 80 },
  track: { type: String, enum: ["html", "css", "javascript", "python"], required: true, index: true },
  language: { type: String, default: "javascript", maxlength: 40 },
  codeSnapshot: { type: String, required: true, maxlength: 65536 }, // 64 KB hard limit
  status: {
    type: String,
    enum: ["accepted", "partially_passed", "failed", "runtime_error", "syntax_error", "timeout"],
    required: true,
    index: true,
  },
  testsPassed: { type: Number, default: 0, min: 0 },
  testsTotal: { type: Number, default: 0, min: 0 },
  runtimeMs: { type: Number, default: 0, min: 0 },
  validationSummary: { type: [ValidationCheckSchema], default: [] },
  submittedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

CodingSubmissionSchema.index({ userId: 1, lessonId: 1, submittedAt: -1 });
CodingSubmissionSchema.index({ userId: 1, courseId: 1, submittedAt: -1 });

module.exports = mongoose.model("CodingSubmission", CodingSubmissionSchema);

