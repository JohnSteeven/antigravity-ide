const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Subcategory name must be at least 2 characters."],
      maxlength: [50, "Subcategory name cannot exceed 50 characters."]
    },
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
