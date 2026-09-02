const mongoose = require("mongoose");

const CreatorEngagementEventSchema = new mongoose.Schema({
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, select: false },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  contentType: { type: String, enum: ["article", "story", "course", "lesson", "video", "podcast", "resource"], required: true, index: true },
  eventType: { type: String, enum: ["view", "read", "watch", "listen", "lesson_completion", "course_progression", "save"], required: true, index: true },
  idempotencyKey: { type: String, required: true, maxlength: 120 },
  sessionHash: { type: String, required: true, select: false },
  occurredAt: { type: Date, default: Date.now, immutable: true, index: true },
  durationSeconds: { type: Number, default: 0, min: 0, max: 86400 },
  progressRatio: { type: Number, default: 0, min: 0, max: 1 },
  premiumEntitledAtEvent: { type: Boolean, default: false },
  qualificationState: { type: String, enum: ["qualified", "unqualified"], required: true, index: true },
  qualificationReason: { type: String, required: true, select: false },
  source: { type: String, enum: ["web", "mobile_web", "system"], default: "web" },
}, { timestamps: false });

CreatorEngagementEventSchema.index({ actorUserId: 1, idempotencyKey: 1 }, { unique: true, name: "creator_engagement_dedupe" });
CreatorEngagementEventSchema.index({ creatorId: 1, occurredAt: -1 });
CreatorEngagementEventSchema.index({ contentId: 1, occurredAt: -1 });

module.exports = mongoose.model("CreatorEngagementEvent", CreatorEngagementEventSchema);
