const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [2, "Tag name must be at least 2 characters."],
      maxlength: [30, "Tag name cannot exceed 30 characters."]
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    color: {
      type: String,
      default: "#426c67",
      validate: {
        validator: (val) => /^#[0-9A-Fa-f]{6}$/.test(val),
        message: "Invalid hex color format."
      }
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

TagSchema.index({ isDeleted: 1, name: 1 });

module.exports = mongoose.model("Tag", TagSchema);
