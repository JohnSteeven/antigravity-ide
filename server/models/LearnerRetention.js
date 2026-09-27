const mongoose = require("mongoose");

const LearnerAchievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "🏆" },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LearnerRetentionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: null },
    achievements: { type: [LearnerAchievementSchema], default: [] },
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearnerRetention", LearnerRetentionSchema);
