const mongoose = require("mongoose");

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: "", maxlength: 1000 },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", default: null, index: true },
  status: { type: String, enum: ["draft", "active", "archived"], default: "active", index: true },
  sortOrder: { type: Number, default: 0 },
  icon: { type: String, default: "book" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

TopicSchema.index({ status: 1, sortOrder: 1, name: 1 });

module.exports = mongoose.model("Topic", TopicSchema);
