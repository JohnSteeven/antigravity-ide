const mongoose = require("mongoose");

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    inquiryType: {
      type: String,
      enum: [
        "General Question",
        "Feedback",
        "Feature Request",
        "Bug Report",
        "Collaboration",
        "Business Inquiry",
        "Report Content",
        "Other",
      ],
      default: "General Question",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },
    replied: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["unread", "read", "in_progress", "waiting", "resolved", "closed", "archived", "spam"],
      default: "unread",
      index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String, default: "" },

    // Centralized Audit Fields
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ isDeleted: 1, status: 1, inquiryType: 1, priority: 1 });

module.exports = mongoose.model("ContactMessage", ContactMessageSchema);
