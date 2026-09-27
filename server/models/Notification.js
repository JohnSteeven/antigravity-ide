const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: Date,
    type: {
      type: String,
      enum: [
        "daily_quote",
        "article",
        "summary",
        "reminder",
        "creator_application",
        "creator_content",
        "achievement_unlocked",
        "course_completed",
        "streak_milestone",
        "creator_engagement_milestone",
        "premium_lifecycle",
        "account_lifecycle",
      ],
    },
    status: { type: String, enum: ["unread", "read"], default: "unread" },
    source: { type: String, enum: ["site", "life"], default: "site", index: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedEntityType: {
      type: String,
      enum: ["achievement", "course", "creator", "membership", "account", "article"],
      default: null,
    },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedEntityKey: { type: String, trim: true, maxlength: 160, default: null },
    actionUrl: { type: String, trim: true, maxlength: 500, default: null },
    dedupeKey: { type: String, trim: true, maxlength: 180, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index(
  { user: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);
NotificationSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
