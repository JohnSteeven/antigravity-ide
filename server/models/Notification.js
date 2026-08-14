const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: Date,
    type: { type: String, enum: ["daily_quote", "article", "summary", "reminder"] },
    status: { type: String, enum: ["unread", "read"], default: "unread" },
    source: { type: String, enum: ["site", "life"], default: "site", index: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
