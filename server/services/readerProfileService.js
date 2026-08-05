/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  readerProfileService.js  —  Reader Profile, Collections & Learning Paths Service
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ReaderProfile = require('../models/ReaderProfile');
const ReadingCollection = require('../models/ReadingCollection');
const LearningPath = require('../models/LearningPath');

class ReaderProfileService {
  /**
   * Get or create a ReaderProfile for a user.
   */
  static async getProfile(userId) {
    let profile = await ReaderProfile.findOne({ userId }).lean();
    if (!profile) {
      profile = await ReaderProfile.create({ userId });
      profile = profile.toObject();
    }
    return profile;
  }

  /**
   * Update ReaderProfile preferences (categories, goals, dark mode, notifications).
   */
  static async updateProfile(userId, updates) {
    let profile = await ReaderProfile.findOne({ userId });
    if (!profile) profile = new ReaderProfile({ userId });

    if (updates.favoriteCategories) profile.favoriteCategories = updates.favoriteCategories;
    if (updates.preferredLanguage) profile.preferredLanguage = updates.preferredLanguage;
    if (updates.themePreference) profile.themePreference = updates.themePreference;
    if (updates.readingGoal) Object.assign(profile.readingGoal, updates.readingGoal);
    if (updates.notifications) Object.assign(profile.notifications, updates.notifications);

    await profile.save();
    return profile;
  }

  // ── Collections Management ─────────────────────────────────────────────────

  static async getCollections(userId) {
    return ReadingCollection.find({ userId }).populate('articles', 'title slug category coverImage readingTime').lean();
  }

  static async createCollection(userId, data) {
    const slug = (data.title || 'collection').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return ReadingCollection.create({
      userId,
      title: data.title,
      slug,
      description: data.description || '',
      isPublic: data.isPublic || false,
      articles: data.articles || [],
    });
  }

  static async addArticleToCollection(userId, collectionId, articleId) {
    return ReadingCollection.findOneAndUpdate(
      { _id: collectionId, userId },
      { $addToSet: { articles: articleId } },
      { new: true }
    );
  }

  // ── Learning Paths ─────────────────────────────────────────────────────────

  static async getLearningPaths(category = null) {
    const filter = { isPublished: true };
    if (category) filter.category = category;
    return LearningPath.find(filter).populate('steps.articleId', 'title slug category readingTime').lean();
  }

  /**
   * Seed default learning paths on startup if collection is empty.
   */
  static async seedDefaultPaths() {
    try {
      const count = await LearningPath.countDocuments();
      if (count === 0) {
        await LearningPath.create({
          title: 'React & Modern Frontend Architecture',
          slug: 'react-frontend-architecture',
          description: 'Step-by-step pathway from React fundamentals to enterprise state management.',
          category: 'Coding',
          difficulty: 'intermediate',
          icon: 'code',
          steps: [
            { stepOrder: 1, title: 'JavaScript ES6+ Essentials', description: 'Master modern JS features before React' },
            { stepOrder: 2, title: 'React Hooks & Component Lifecycle', description: 'Understand useState, useEffect, and custom hooks' },
            { stepOrder: 3, title: 'State Management & Context API', description: 'Manage global application state cleanly' },
          ],
        });
        console.info('[LearningPath] Seeded default React learning path.');
      }
    } catch (err) {
      console.error('[LearningPath] Seed error:', err.message);
    }
  }
}

module.exports = ReaderProfileService;
