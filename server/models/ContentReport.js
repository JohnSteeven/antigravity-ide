const mongoose = require("mongoose");

const ContentReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, select: false, index: true },
  targetType: { type: String, enum: ["article", "story", "course", "lesson", "video", "podcast", "resource"], required: true, index: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  reason: { type: String, enum: ["spam", "harassment", "copyright", "dangerous", "misleading", "privacy", "other"], required: true },
  details: { type: String, default: "", maxlength: 2000, select: false },
  status: { type: String, enum: ["pending", "reviewing", "resolved", "dismissed"], default: "pending", index: true },
  openDedupeKey: { type: String, default: null, select: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, select: false },
  reviewedAt: { type: Date, default: null },
  privateResolutionNote: { type: String, default: "", maxlength: 4000, select: false },
}, { timestamps: true });

ContentReportSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });
ContentReportSchema.index({ openDedupeKey: 1 }, { unique: true, partialFilterExpression: { openDedupeKey: { $type: "string" } }, name: "content_report_open_unique" });

ContentReportSchema.pre("validate", function setOpenDedupeKey(next) {
  this.openDedupeKey = ["pending", "reviewing"].includes(this.status)
    ? `${this.reporterId}:${this.targetType}:${this.targetId}`
    : null;
  return next();
});

module.exports = mongoose.model("ContentReport", ContentReportSchema);
