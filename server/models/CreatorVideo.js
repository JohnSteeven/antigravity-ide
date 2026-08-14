const mongoose = require("mongoose");
const { ACCESS_LEVELS, PUBLICATION_STATUSES } = require("../learn/constants");
const { CREATOR_WORKFLOW_STATUSES } = require("../creators/constants");

const CreatorVideoSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 3000 },
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic", index: true }],
  language: { type: String, required: true, maxlength: 60, index: true },
  durationSeconds: { type: Number, default: 0, min: 0, max: 86400 },
  thumbnail: { type: String, default: "" },
  thumbnailAlt: { type: String, default: "", maxlength: 240 },
  mediaAssetId: { type: mongoose.Schema.Types.ObjectId, ref: "ProtectedMediaAsset", required: true, select: false },
  transcript: { type: String, default: "", select: false },
  captionAssetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProtectedMediaAsset", select: false }],
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null, index: true },
  seriesId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  accessLevel: { type: String, enum: ACCESS_LEVELS, default: "free", index: true },
  publicationStatus: { type: String, enum: PUBLICATION_STATUSES, default: "draft", index: true },
  workflowStatus: { type: String, enum: CREATOR_WORKFLOW_STATUSES, default: "draft", index: true },
  rightsConfirmedAt: { type: Date, required: true },
  publishedAt: { type: Date, default: null, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

CreatorVideoSchema.index({ publicationStatus: 1, accessLevel: 1, publishedAt: -1 });
CreatorVideoSchema.index({ creatorId: 1, workflowStatus: 1, updatedAt: -1 });
CreatorVideoSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("CreatorVideo", CreatorVideoSchema);
