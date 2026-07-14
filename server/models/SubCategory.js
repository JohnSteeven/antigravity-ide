const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SubCategorySchema.index({ isDeleted: 1, category: 1 });
SubCategorySchema.index({ slug: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("SubCategory", SubCategorySchema);
