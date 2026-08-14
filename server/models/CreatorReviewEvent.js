const mongoose = require("mongoose");
const { CREATOR_APPLICATION_STATUSES } = require("../creators/constants");

const CreatorReviewEventSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorApplication", required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fromStatus: { type: String, enum: CREATOR_APPLICATION_STATUSES, required: true },
  toStatus: { type: String, enum: CREATOR_APPLICATION_STATUSES, required: true, index: true },
  publicMessage: { type: String, default: "", maxlength: 2000 },
  privateNote: { type: String, default: "", maxlength: 5000, select: false },
  occurredAt: { type: Date, default: Date.now, immutable: true },
}, { timestamps: false });

CreatorReviewEventSchema.index({ applicationId: 1, occurredAt: -1 });

module.exports = mongoose.model("CreatorReviewEvent", CreatorReviewEventSchema);
