const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, trim: true, default: "" },
    source: { type: String, default: "website_footer" },
    status: {
      type: String,
      enum: ["pending", "verified", "unsubscribed", "blocked", "bounced"],
      default: "pending",
      index: true,
    },
    verified: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    verificationTokenHash: { type: String, default: null, index: true },
    verificationExpiresAt: { type: Date, default: null },
    preferenceTokenHash: { type: String, default: null, index: true },
    subscribedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
    unsubscribedAt: { type: Date, default: null },
    lastEmailSentAt: { type: Date, default: null },
    resubscribeCount: { type: Number, default: 0 },
    preferences: {
      weeklyDigest: { type: Boolean, default: true },
      newArticles: { type: Boolean, default: true },
      featuredArticles: { type: Boolean, default: true },
      mustRead: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
    },
    tags: [{ type: String, trim: true }],
    deliveryStatus: {
      type: String,
      enum: ["none", "queued", "sent", "failed", "bounced"],
      default: "none",
    },
    opensCount: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 },
    lastOpenedAt: { type: Date, default: null },
    lastClickedAt: { type: Date, default: null },
    unsubscribeReason: { type: String, default: "" },
    resendCooldownExpiresAt: { type: Date, default: null },
    bouncedAt: { type: Date, default: null },
    bounceReason: { type: String, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SubscriberSchema.index({ isDeleted: 1, email: 1 });
SubscriberSchema.index({ status: 1, active: 1, isDeleted: 1 });

module.exports = mongoose.model("Subscriber", SubscriberSchema);
