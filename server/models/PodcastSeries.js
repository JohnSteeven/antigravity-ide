const mongoose = require("mongoose");
const { ACCESS_LEVELS, PUBLICATION_STATUSES } = require("../learn/constants");
const { CREATOR_WORKFLOW_STATUSES } = require("../creators/constants");

const PodcastSeriesSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 3000 },
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic", index: true }],
  language: { type: String, required: true, maxlength: 60, index: true },
  coverImage: { type: String, default: "" },
  coverImageAlt: { type: String, default: "", maxlength: 240 },
  accessLevel: { type: String, enum: ACCESS_LEVELS, default: "free", index: true },
  publicationStatus: { type: String, enum: PUBLICATION_STATUSES, default: "draft", index: true },
  workflowStatus: { type: String, enum: CREATOR_WORKFLOW_STATUSES, default: "draft", index: true },
  rightsConfirmedAt: { type: Date, required: true },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

PodcastSeriesSchema.index({ publicationStatus: 1, publishedAt: -1 });
PodcastSeriesSchema.index({ creatorId: 1, workflowStatus: 1, updatedAt: -1 });

module.exports = mongoose.model("PodcastSeries", PodcastSeriesSchema);
