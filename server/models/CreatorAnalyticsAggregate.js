const mongoose = require("mongoose");

const MetricsSchema = new mongoose.Schema({
  rawEvents: { type: Number, default: 0, min: 0 },
  qualifiedEvents: { type: Number, default: 0, min: 0 },
  views: { type: Number, default: 0, min: 0 },
  qualifiedReads: { type: Number, default: 0, min: 0 },
  qualifiedWatches: { type: Number, default: 0, min: 0 },
  qualifiedListens: { type: Number, default: 0, min: 0 },
  lessonCompletions: { type: Number, default: 0, min: 0 },
  courseProgressions: { type: Number, default: 0, min: 0 },
  meaningfulSaves: { type: Number, default: 0, min: 0 },
  qualifiedDurationSeconds: { type: Number, default: 0, min: 0 },
}, { _id: false });

const CreatorAnalyticsAggregateSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  contentType: { type: String, required: true, index: true },
  day: { type: Date, required: true, index: true },
  metrics: { type: MetricsSchema, default: () => ({}) },
}, { timestamps: true });

CreatorAnalyticsAggregateSchema.index({ creatorId: 1, contentId: 1, day: 1 }, { unique: true });
CreatorAnalyticsAggregateSchema.index({ creatorId: 1, day: -1, contentType: 1 });

module.exports = mongoose.model("CreatorAnalyticsAggregate", CreatorAnalyticsAggregateSchema);
