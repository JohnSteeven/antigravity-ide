const mongoose = require("mongoose");
const crypto = require("crypto");

const GameQuestionSchema = new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID() },
  prompt: { type: String, required: true, trim: true, maxlength: 1000 },
  category: { type: String, default: "General", trim: true, maxlength: 60 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  options: {
    type: [{ type: String, trim: true, maxlength: 300 }],
    validate: [
      (val) => !val || (val.length >= 2 && val.length <= 6),
      "Each question must provide between 2 and 6 options.",
    ],
  },
  correctAnswer: { type: String, trim: true, maxlength: 300, select: false, default: "" },
  explanation: { type: String, trim: true, maxlength: 1000, default: "" },
}, { _id: false });

const GameContentPackSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  gameKey: {
    type: String,
    required: true,
    enum: ["who-knows-me-better", "life-auction", "daily-challenge"],
    index: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: "", trim: true, maxlength: 1000 },
  locale: { type: String, default: "en", trim: true, lowercase: true, maxlength: 10 },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard", "mixed"],
    default: "mixed",
  },
  status: {
    type: String,
    enum: ["draft", "review", "published", "archived"],
    default: "draft",
    index: true,
  },
  version: { type: Number, default: 1, min: 1 },
  tags: [{ type: String, trim: true, maxlength: 40 }],
  questions: { type: [GameQuestionSchema], default: [] },

  isDeleted: { type: Boolean, default: false, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

// Justified index for querying active packs by game and locale
GameContentPackSchema.index({ gameKey: 1, locale: 1, status: 1, isDeleted: 1 });

module.exports = mongoose.model("GameContentPack", GameContentPackSchema);

