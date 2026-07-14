const mongoose = require("mongoose");

const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    fileName: { type: String, trim: true, default: "" },
    type: { type: String, default: "image" },
    url: { type: String, required: true },
    album: { type: String, default: "General", index: true },
    alt: { type: String, trim: true, default: "" },
    size: { type: String, default: "" },
    category: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
    visibility: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

GallerySchema.index({ isDeleted: 1, album: 1, sortOrder: 1 });

module.exports = mongoose.model("Gallery", GallerySchema);
