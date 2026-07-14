const mongoose = require("mongoose");

const BackupSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    size: { type: String, default: "" },
    recordCounts: {
      articles: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      categories: { type: Number, default: 0 },
      tags: { type: Number, default: 0 },
      settings: { type: Number, default: 0 },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Backup", BackupSchema);
