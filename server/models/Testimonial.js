const mongoose = require("mongoose");

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    testimonial: { type: String, required: true, trim: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

TestimonialSchema.index({ isDeleted: 1, displayOrder: 1 });

module.exports = mongoose.model("Testimonial", TestimonialSchema);
