const mongoose = require('mongoose');
const Article = require('../models/Article');
const ReadingProgress = require('../models/ReadingProgress');
const ReaderProfile = require('../models/ReaderProfile');
const AchievementService = require('./achievementService');

const AUTO_COMPLETION_PERCENT = 80;
const MAX_ACTIVE_SECONDS_PER_UPDATE = 15 * 60;
const ARTICLE_FIELDS = 'title slug description excerpt coverImage category readingTime publishedAt contentType status isDeleted';

const readerError = (message, status = 422) => Object.assign(new Error(message), { status });

const numberInRange = (value, name, min, max) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw readerError(`${name} must be between ${min} and ${max}.`);
  }
  return number;
};

const asObjectId = (value, name) => {
  if (!mongoose.isValidObjectId(value)) throw readerError(`${name} is invalid.`);
  return new mongoose.Types.ObjectId(value);
};

const serializeProgress = (progress) => {
  if (!progress?.articleId) return null;
  const article = progress.articleId;
  return {
    id: String(progress._id),
    article: {
      id: String(article._id || article.id),
      title: article.title,
      slug: article.slug,
      description: article.description || article.excerpt || '',
      excerpt: article.excerpt || article.description || '',
      coverImage: article.coverImage || '',
      category: article.category || '',
      readingTime: article.readingTime || '',
      publishedAt: article.publishedAt || null,
    },
    progressPercent: progress.progressPercent ?? progress.completionPercent ?? 0,
    furthestProgressPercent: progress.furthestProgressPercent
      ?? progress.progressPercent
      ?? progress.completionPercent
      ?? 0,
    lastPosition: progress.lastPosition ?? progress.scrollPositionPx ?? 0,
    activeReadingSeconds: progress.activeReadingSeconds ?? progress.timeSpentSeconds ?? 0,
    isCompleted: Boolean(progress.isCompleted),
    completedAt: progress.completedAt || null,
    completionSource: progress.completionSource || null,
    lastReadAt: progress.lastReadAt || null,
    continueUrl: `/articles/${article.slug}`,
  };
};

const populateOwnedArticle = (query) => query.populate({
  path: 'articleId',
  match: { contentType: 'article', status: 'published', isDeleted: false },
  select: ARTICLE_FIELDS,
});

class ReadingProgressService {
  /**
   * Persist one meaningful periodic update. Monotonic fields use $max, active
   * time uses $inc, and completion is a separate compare-and-set so concurrent
   * writes cannot regress or count completion twice.
   */
  static async updateProgress(data = {}) {
    const userId = asObjectId(data.userId, 'userId');
    const articleId = asObjectId(data.articleId, 'articleId');
    const progressPercent = numberInRange(
      data.progressPercent ?? data.completionPercent ?? 0,
      'progressPercent',
      0,
      100
    );
    const lastPosition = numberInRange(
      data.lastPosition ?? data.scrollPositionPx ?? 0,
      'lastPosition',
      0,
      Number.MAX_SAFE_INTEGER
    );
    const activeReadingSeconds = numberInRange(
      data.activeReadingSeconds ?? data.timeSpentSeconds ?? 0,
      'activeReadingSeconds',
      0,
      MAX_ACTIVE_SECONDS_PER_UPDATE
    );

    const article = await Article.findOne({
      _id: articleId,
      contentType: 'article',
      status: 'published',
      isDeleted: false,
    }).select('_id').lean();
    if (!article) throw readerError('Published Article not found.', 404);

    const now = new Date();
    const filter = { userId, articleId };
    const update = {
      $max: {
        progressPercent,
        furthestProgressPercent: progressPercent,
        lastPosition,
      },
      $inc: { activeReadingSeconds },
      $set: { lastReadAt: now },
      $setOnInsert: {
        userId,
        articleId,
        isCompleted: false,
        completedAt: null,
        completionSource: null,
        createdAt: now,
      },
    };

    let progress;
    try {
      progress = await ReadingProgress.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      progress = await ReadingProgress.findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
      });
    }

    const shouldAutoComplete = progressPercent >= AUTO_COMPLETION_PERCENT;
    const shouldManuallyComplete = data.isCompleted === true;
    if (shouldAutoComplete || shouldManuallyComplete) {
      const newlyCompleted = await ReadingProgress.findOneAndUpdate(
        { ...filter, isCompleted: false },
        {
          $set: {
            isCompleted: true,
            completedAt: now,
            completionSource: shouldManuallyComplete ? 'manual' : 'auto',
            lastReadAt: now,
          },
        },
        { new: true, runValidators: true }
      );
      if (newlyCompleted) {
        progress = newlyCompleted;
        await ReadingProgressService.onArticleCompleted(userId);
      }
    }

    return ReadingProgressService.getProgress(userId, articleId);
  }

  /** Update lightweight completion/streak aggregates only after completion CAS. */
  static async onArticleCompleted(userId) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86_400_000);

    await ReaderProfile.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await ReaderProfile.findOneAndUpdate(
      { userId },
      [
        {
          $set: {
            totalArticlesRead: { $add: [{ $ifNull: ['$totalArticlesRead', 0] }, 1] },
            _nextStreak: {
              $cond: [
                { $gte: ['$lastActiveDate', today] },
                { $ifNull: ['$currentStreakDays', 0] },
                {
                  $cond: [
                    { $gte: ['$lastActiveDate', yesterday] },
                    { $add: [{ $ifNull: ['$currentStreakDays', 0] }, 1] },
                    1,
                  ],
                },
              ],
            },
            lastActiveDate: {
              $cond: [{ $gte: ['$lastActiveDate', today] }, '$lastActiveDate', new Date()],
            },
          },
        },
        {
          $set: {
            currentStreakDays: '$_nextStreak',
            longestStreakDays: {
              $max: [{ $ifNull: ['$longestStreakDays', 0] }, '$_nextStreak'],
            },
          },
        },
        { $unset: '_nextStreak' },
      ],
      { new: true }
    );
    await AchievementService.evaluateAchievements(userId);
  }

  static async getProgress(userId, articleId) {
    const owned = await populateOwnedArticle(
      ReadingProgress.findOne({
        userId: asObjectId(userId, 'userId'),
        articleId: asObjectId(articleId, 'articleId'),
      })
    ).lean();
    return serializeProgress(owned);
  }

  static async getContinueReading(userId) {
    const rows = await populateOwnedArticle(
      ReadingProgress.find({ userId: asObjectId(userId, 'userId'), isCompleted: false })
        .sort({ lastReadAt: -1 })
        .limit(12)
    ).lean();
    return rows.map(serializeProgress).filter(Boolean).slice(0, 6);
  }

  static async getCompleted(userId) {
    const rows = await populateOwnedArticle(
      ReadingProgress.find({
        userId: asObjectId(userId, 'userId'),
        isCompleted: true,
        completedAt: { $ne: null },
      })
        .sort({ completedAt: -1 })
        .limit(24)
    ).lean();
    return rows.map(serializeProgress).filter(Boolean).slice(0, 12);
  }
}

ReadingProgressService.AUTO_COMPLETION_PERCENT = AUTO_COMPLETION_PERCENT;

module.exports = ReadingProgressService;
