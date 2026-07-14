const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    longDescription: { type: String, default: "" },
    icon: { type: String, default: "book" },
    heroImage: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    subcategories: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

CategorySchema.index({ isDeleted: 1, isActive: 1, sortOrder: 1 });

CategorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("Category", CategorySchema);
