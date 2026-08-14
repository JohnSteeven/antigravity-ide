const crypto = require("crypto");
const mongoose = require("mongoose");
const { CREATOR_CONTENT_TYPES, CREATOR_PROFILE_STATUSES } = require("../creators/constants");

const PublicLinkSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 60 },
  url: { type: String, trim: true, maxlength: 500 },
}, { _id: false });

const FeaturedContentSchema = new mongoose.Schema({
  contentType: { type: String, enum: CREATOR_CONTENT_TYPES, required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { _id: false });

const CreatorProfileSchema = new mongoose.Schema({
  creatorKey: { type: String, default: () => crypto.randomUUID(), immutable: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorApplication", required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, required: true, trim: true, maxlength: 100 },
  headline: { type: String, required: true, trim: true, maxlength: 180 },
  biography: { type: String, required: true, trim: true, maxlength: 5000 },
  profileImage: { type: String, default: "", trim: true },
  coverImage: { type: String, default: "", trim: true },
  specialties: { type: [String], default: [], index: true },
  languages: { type: [String], default: [], index: true },
  creatorTypes: { type: [String], default: [] },
  publicLinks: { type: [PublicLinkSchema], default: [] },
  status: { type: String, enum: CREATOR_PROFILE_STATUSES, default: "approved", index: true },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, select: false },
  isFeatured: { type: Boolean, default: false, index: true },
  moduleOrder: { type: [String], default: ["courses", "videos", "articles", "stories", "podcasts", "resources", "about"] },
  featuredContent: {
    type: [FeaturedContentSchema],
    default: [],
    validate: { validator: (items) => items.length <= 6, message: "Choose no more than six featured items." },
  },
  permissions: {
    canPublishWithoutReview: { type: Boolean, default: false },
    canScheduleDirectly: { type: Boolean, default: false },
  },
  metrics: {
    followerCount: { type: Number, default: 0, min: 0 },
    publishedContentCount: { type: Number, default: 0, min: 0 },
    learnerCount: { type: Number, default: 0, min: 0 },
  },
  deactivatedAt: { type: Date, default: null },
}, { timestamps: true });

CreatorProfileSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "objectId" } }, name: "creator_profile_user_unique" });
CreatorProfileSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
CreatorProfileSchema.index({ status: 1, specialties: 1 });
CreatorProfileSchema.index({ displayName: "text", headline: "text", biography: "text", specialties: "text" });

module.exports = mongoose.model("CreatorProfile", CreatorProfileSchema);
