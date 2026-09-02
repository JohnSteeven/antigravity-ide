/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  readerProfileService.js  —  Reader Profile, Collections & Learning Paths Service
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const ReaderProfile = require('../models/ReaderProfile');
const ReadingProgress = require('../models/ReadingProgress');
const Article = require('../models/Article');
const ReadingCollection = require('../models/ReadingCollection');
const LearningPath = require('../models/LearningPath');
const { DAILY_QUOTE_TIME_SLOTS } = require('../config/notificationPreferences');

const LIBRARY_FIELDS = new Set(['bookmarks', 'likedArticles', 'savedArticles']);
const ARTICLE_CARD_FIELDS = 'title slug description excerpt coverImage category readingTime publishedAt';

const asObjectId = (value) => {
  if (!mongoose.isValidObjectId(value)) {
    throw Object.assign(new Error('Invalid identifier.'), { status: 422 });
  }
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(value);
};

const startOfUtcWeek = (now = new Date()) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1));
  return start;
};

const serializeArticle = (article) => ({
  id: String(article._id || article.id),
  title: article.title,
  slug: article.slug,
  description: article.description || article.excerpt || '',
  excerpt: article.excerpt || article.description || '',
  coverImage: article.coverImage || '',
  category: article.category || '',
  readingTime: article.readingTime || '',
  publishedAt: article.publishedAt || null,
});

const orderArticles = (ids, articles) => {
  const byId = new Map(articles.map((article) => [String(article._id), article]));
  return (ids || []).map((id) => byId.get(String(id))).filter(Boolean).map(serializeArticle);
};

class ReaderProfileService {
  /**
   * Get or create a ReaderProfile for a user.
   */
  static async getProfile(userId) {
    return ReaderProfile.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  }

  /**
   * Return the private, authenticated Reader/Profile contract. The account DTO
   * is deliberately allowlisted; auth/security and scheduler metadata never
   * cross this boundary.
   */
  static async getProfileContract(user) {
    const userId = asObjectId(user._id || user.id);
    const profile = await ReaderProfileService.getProfile(userId);
    const libraryIds = [
      ...(profile.bookmarks || []),
      ...(profile.likedArticles || []),
      ...(profile.savedArticles || []),
    ];

    const [summaries, articles] = await Promise.all([
      ReadingProgress.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: Article.collection.name,
            localField: 'articleId',
            foreignField: '_id',
            as: 'article',
          },
        },
        { $unwind: '$article' },
        {
          $match: {
            'article.contentType': 'article',
            'article.status': 'published',
            'article.isDeleted': false,
          },
        },
        {
          $group: {
            _id: null,
            articlesRead: { $sum: { $cond: ['$isCompleted', 1, 0] } },
            activeReadingSeconds: {
              $sum: { $ifNull: ['$activeReadingSeconds', { $ifNull: ['$timeSpentSeconds', 0] }] },
            },
            articlesReadThisWeek: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      '$isCompleted',
                      { $gte: ['$completedAt', startOfUtcWeek()] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      libraryIds.length
        ? Article.find({
          _id: { $in: libraryIds },
          contentType: 'article',
          status: 'published',
          isDeleted: false,
        }).select(ARTICLE_CARD_FIELDS).lean()
        : [],
    ]);

    const summary = summaries[0] || {
      articlesRead: 0,
      activeReadingSeconds: 0,
      articlesReadThisWeek: 0,
    };
    const accountProfile = user.profile?.toObject
      ? user.profile.toObject()
      : (user.profile || {});
    const goal = profile.readingGoal || {};

    return {
      account: {
        id: String(userId),
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        role: user.role || 'Reader',
        createdAt: user.createdAt || null,
        profile: {
          avatar: accountProfile.avatar || '',
          coverImage: accountProfile.coverImage || '',
          bio: accountProfile.bio || '',
          location: accountProfile.location || '',
          website: accountProfile.website || '',
          skills: accountProfile.skills || [],
        },
      },
      reader: {
        interests: profile.favoriteCategories || [],
        goals: {
          articlesPerWeekTarget: goal.articlesPerWeekTarget ?? 5,
          minutesPerDayTarget: goal.minutesPerDayTarget ?? 20,
          articlesReadThisWeek: summary.articlesReadThisWeek || 0,
        },
        preferences: {
          language: profile.preferredLanguage || 'en',
          theme: profile.themePreference || 'system',
        },
        streakSummary: {
          currentDays: profile.currentStreakDays || 0,
          longestDays: profile.longestStreakDays || 0,
          lastActiveAt: profile.lastActiveDate || null,
        },
        readingSummary: {
          articlesRead: summary.articlesRead || 0,
          activeReadingSeconds: summary.activeReadingSeconds || 0,
        },
        achievements: (profile.achievements || []).map((achievement) => ({
          key: achievement.key,
          title: achievement.title,
          description: achievement.description || '',
          icon: achievement.icon || 'award',
          unlockedAt: achievement.unlockedAt || null,
        })),
      },
      library: {
        saved: orderArticles(profile.savedArticles, articles),
        liked: orderArticles(profile.likedArticles, articles),
        bookmarked: orderArticles(profile.bookmarks, articles),
      },
      contracts: {
        dailyQuoteTimeSlots: DAILY_QUOTE_TIME_SLOTS,
      },
    };
  }

  /**
   * Update ReaderProfile interests, goal targets, language, and theme.
   */
  static async updateProfile(userId, updates = {}) {
    const allowed = new Set(['favoriteCategories', 'preferredLanguage', 'themePreference', 'readingGoal']);
    const unknown = Object.keys(updates).find((key) => !allowed.has(key));
    if (unknown) throw Object.assign(new Error(`Unknown reader profile field: ${unknown}`), { status: 422 });

    const set = {};
    if (updates.favoriteCategories !== undefined) {
      if (!Array.isArray(updates.favoriteCategories) || updates.favoriteCategories.length > 30) {
        throw Object.assign(new Error('favoriteCategories must be an array with at most 30 values.'), { status: 422 });
      }
      set.favoriteCategories = [...new Set(updates.favoriteCategories.map((value) => String(value).trim()).filter(Boolean))];
    }
    if (updates.preferredLanguage !== undefined) {
      const language = String(updates.preferredLanguage).trim();
      if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language)) {
        throw Object.assign(new Error('preferredLanguage must be a supported language code.'), { status: 422 });
      }
      set.preferredLanguage = language;
    }
    if (updates.themePreference !== undefined) {
      if (!['light', 'dark', 'system'].includes(updates.themePreference)) {
        throw Object.assign(new Error('themePreference must be light, dark, or system.'), { status: 422 });
      }
      set.themePreference = updates.themePreference;
    }
    if (updates.readingGoal !== undefined) {
      const goal = updates.readingGoal;
      if (!goal || typeof goal !== 'object' || Array.isArray(goal)) {
        throw Object.assign(new Error('readingGoal must be an object.'), { status: 422 });
      }
      const unknownGoal = Object.keys(goal).find((key) => !['articlesPerWeekTarget', 'minutesPerDayTarget'].includes(key));
      if (unknownGoal) throw Object.assign(new Error(`Unknown reading goal field: ${unknownGoal}`), { status: 422 });
      if (goal.articlesPerWeekTarget !== undefined) {
        const target = Number(goal.articlesPerWeekTarget);
        if (!Number.isInteger(target) || target < 1 || target > 100) {
          throw Object.assign(new Error('articlesPerWeekTarget must be an integer from 1 to 100.'), { status: 422 });
        }
        set['readingGoal.articlesPerWeekTarget'] = target;
      }
      if (goal.minutesPerDayTarget !== undefined) {
        const target = Number(goal.minutesPerDayTarget);
        if (!Number.isInteger(target) || target < 1 || target > 1440) {
          throw Object.assign(new Error('minutesPerDayTarget must be an integer from 1 to 1440.'), { status: 422 });
        }
        set['readingGoal.minutesPerDayTarget'] = target;
      }
    }

    return ReaderProfile.findOneAndUpdate(
      { userId },
      { $set: set, $setOnInsert: { userId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  static async toggleArticleReference(userId, field, articleId) {
    if (!LIBRARY_FIELDS.has(field)) throw Object.assign(new Error('Invalid reader library field.'), { status: 422 });
    const normalizedUserId = asObjectId(userId);
    const normalizedArticleId = asObjectId(articleId);
    const article = await Article.findOne({
      _id: normalizedArticleId,
      contentType: 'article',
      status: 'published',
      isDeleted: false,
    }).select(ARTICLE_CARD_FIELDS).lean();
    if (!article) throw Object.assign(new Error('Published Article not found.'), { status: 404 });

    await ReaderProfile.findOneAndUpdate(
      { userId: normalizedUserId },
      { $setOnInsert: { userId: normalizedUserId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const profile = await ReaderProfile.findOneAndUpdate(
      { userId: normalizedUserId },
      [{
        $set: {
          [field]: {
            $cond: [
              { $in: [normalizedArticleId, { $ifNull: [`$${field}`, []] }] },
              {
                $filter: {
                  input: { $ifNull: [`$${field}`, []] },
                  as: 'articleId',
                  cond: { $ne: ['$$articleId', normalizedArticleId] },
                },
              },
              { $concatArrays: [{ $ifNull: [`$${field}`, []] }, [normalizedArticleId]] },
            ],
          },
        },
      }],
      { new: true }
    );
    return {
      profile,
      isAdded: (profile[field] || []).some((id) => String(id) === String(normalizedArticleId)),
      libraryItem: serializeArticle(article),
    };
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
