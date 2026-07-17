const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Comment body must be at least 3 characters."],
      maxlength: [1000, "Comment body cannot exceed 1000 characters."]
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "spam", "hidden"],
      default: "pending",
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, default: "Reader", trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

CommentSchema.index({ isDeleted: 1, articleId: 1, status: 1 });

CommentSchema.index({ articleId: 1, status: 1 });

module.exports = mongoose.model("Comment", CommentSchema);
