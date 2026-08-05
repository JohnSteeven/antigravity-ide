/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReaderProfile.js  —  Reader Preference, Goals & Gamification Model
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: 'award' },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReadingGoalSchema = new mongoose.Schema(
  {
    articlesPerWeekTarget: { type: Number, default: 5 },
    minutesPerDayTarget: { type: Number, default: 20 },
    articlesReadThisWeek: { type: Number, default: 0 },
    minutesReadToday: { type: Number, default: 0 },
    lastGoalReset: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReaderProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Preferences
    favoriteCategories: [{ type: String, trim: true }],
    preferredLanguage: { type: String, default: 'en' },
    themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },

    // Streaks
    currentStreakDays: { type: Number, default: 0 },
    longestStreakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },

    // Stats
    totalArticlesRead: { type: Number, default: 0 },
    totalReadingTimeMin: { type: Number, default: 0 },

    // Goals & Achievements
    readingGoal: { type: ReadingGoalSchema, default: () => ({}) },
    achievements: { type: [AchievementSchema], default: [] },

    // Notification preferences
    notifications: {
      emailDigest: { type: Boolean, default: true },
      newArticles: { type: Boolean, default: true },
      readingReminders: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReaderProfile', ReaderProfileSchema);
