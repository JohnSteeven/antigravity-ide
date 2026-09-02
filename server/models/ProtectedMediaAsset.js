const mongoose = require("mongoose");
const { ACCESS_LEVELS, MEDIA_LIMITS } = require("../learn/constants");

const ProtectedMediaAssetSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorProfile", required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mediaKind: { type: String, enum: Object.keys(MEDIA_LIMITS), required: true, index: true },
  provider: { type: String, enum: ["unconfigured", "local_development", "external"], default: "unconfigured" },
  providerAssetId: { type: String, default: "", select: false },
  storageKey: { type: String, default: "", select: false },
  publicPreviewUrl: { type: String, default: "" },
  originalName: { type: String, required: true, maxlength: 180 },
  mimeType: { type: String, required: true, maxlength: 120 },
  sizeBytes: { type: Number, required: true, min: 0 },
  durationSeconds: { type: Number, default: 0, min: 0 },
  accessLevel: { type: String, enum: ACCESS_LEVELS, default: "free", index: true },
  scanStatus: { type: String, enum: ["pending", "clean", "quarantined", "unavailable"], default: "unavailable", index: true },
  deliveryStatus: { type: String, enum: ["pending", "ready", "failed"], default: "pending", index: true },
  rightsConfirmedAt: { type: Date, required: true },
  status: { type: String, enum: ["draft", "active", "archived", "removed"], default: "draft", index: true },
}, { timestamps: true });

ProtectedMediaAssetSchema.path("sizeBytes").validate(function withinConfiguredLimit(value) {
  return value <= MEDIA_LIMITS[this.mediaKind];
}, "Asset exceeds the configured limit for its media type.");
ProtectedMediaAssetSchema.index({ creatorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ProtectedMediaAsset", ProtectedMediaAssetSchema);
