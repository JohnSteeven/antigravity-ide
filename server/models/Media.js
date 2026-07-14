const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, default: "image/jpeg" },
    type: {
      type: String,
      enum: ["image", "video", "audio", "pdf", "document"],
      default: "image",
    },
    url: { type: String, required: true },
    provider: { type: String, default: "local" },
    folder: { type: String, default: "Uploads" },
    alt: { type: String, default: "" },
    width: { type: Number },
    height: { type: Number },
    sizeBytes: { type: Number, default: 0 },
    size: { type: String, default: "" },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

MediaSchema.index({ isDeleted: 1, type: 1 });

MediaSchema.index({ type: 1 });
MediaSchema.index({ folder: 1 });

module.exports = mongoose.model("Media", MediaSchema);
