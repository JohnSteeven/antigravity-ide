const mongoose = require("mongoose");
const { ACCESS_LEVELS } = require("../learn/constants");

const ExamDefinitionSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 3000 },
  examCategory: { type: String, required: true, maxlength: 120, index: true },
  jurisdiction: { type: String, default: "", maxlength: 120 },
  subjectLabels: { type: [String], default: [] },
  syllabusSections: { type: [{ stableKey: String, title: String, description: String }], default: [] },
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic" }],
  accessLevel: { type: String, enum: ACCESS_LEVELS, default: "free", index: true },
  status: { type: String, enum: ["draft", "under_review", "published", "archived"], default: "draft", index: true },
  assessmentEngineAvailable: { type: Boolean, default: false, immutable: true },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

ExamDefinitionSchema.index({ status: 1, examCategory: 1, publishedAt: -1 });

module.exports = mongoose.model("ExamDefinition", ExamDefinitionSchema);
