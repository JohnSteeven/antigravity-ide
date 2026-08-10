const mongoose = require("mongoose");

const lifeAuctionContentPackSchema = new mongoose.Schema({
  key: { type: String, required: true, match: /^[a-z0-9][a-z0-9-]{2,79}$/ },
  kind: { type: String, required: true, enum: ["LOTS", "MODES", "EVENTS", "SEASONAL"] },
  locale: { type: String, required: true, default: "en" },
  version: { type: Number, required: true, min: 1 },
  status: { type: String, required: true, enum: ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"], default: "DRAFT" },
  moderationStatus: { type: String, required: true, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  payload: { type: [mongoose.Schema.Types.Mixed], required: true, default: [] },
  checksum: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  publishedAt: { type: Date, default: null },
}, { timestamps: true, minimize: false });

lifeAuctionContentPackSchema.index({ key: 1, locale: 1, version: 1 }, { unique: true });
lifeAuctionContentPackSchema.index({ kind: 1, locale: 1, status: 1, version: -1 });

module.exports = mongoose.model("LifeAuctionContentPack", lifeAuctionContentPackSchema);
