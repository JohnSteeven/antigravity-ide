/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  storyProgressService.js  —  Story Continue Reading & Progress Tracking
 *  MyJourney Platform  |  Phase 4: Life Stories
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  ARCHITECTURE NOTE — Story progress is explicitly separated from Article progress.
 *
 *  The existing ReadingProgressService gates on { contentType: 'article' } and
 *  calls onArticleCompleted() which increments:
 *    - ReaderProfile.totalArticlesRead
 *    - ReaderProfile streak counters (currentStreakDays, longestStreakDays)
 *    - AchievementService evaluations
 *
 *  Story reads must NEVER affect those Article counters. This service:
 *    1. Validates the target document is contentType: 'story' (throws 404 otherwise).
 *    2. Writes to the same ReadingProgress collection (reusing infrastructure).
 *    3. NEVER calls onArticleCompleted. No Article streak, no Article counter,
 *       no creator economics impact.
 *    4. On story completion, updates only StoryProfile.totalStoriesRead (future).
 *       For now, completion is recorded in the ReadingProgress document only.
 */

const mongoose = require('mongoose');
const Article = require('../models/Article');
const ReadingProgress = require('../models/ReadingProgress');

const AUTO_COMPLETION_PERCENT = 80;
const MAX_ACTIVE_SECONDS_PER_UPDATE = 15 * 60;
const STORY_FIELDS = 'title slug description excerpt coverImage category readingTime readingTimeMin publishedAt contentType status isDeleted';

const storyError = (message, status = 422) => Object.assign(new Error(message), { status });

const numberInRange = (value, name, min, max) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw storyError(`${name} must be between ${min} and ${max}.`);
  }
  return number;
};

const asObjectId = (value, name) => {
  if (!mongoose.isValidObjectId(value)) throw storyError(`${name} is invalid.`);
  return new mongoose.Types.ObjectId(value);
};

const serializeStoryProgress = (progress) => {
  if (!progress?.articleId) return null;
  const story = progress.articleId;
  return {
    id: String(progress._id),
    story: {
      id: String(story._id || story.id),
      title: story.title,
      slug: story.slug,
      description: story.description || story.excerpt || '',
      excerpt: story.excerpt || story.description || '',
      coverImage: story.coverImage || '',
      category: story.category || '',
      readingTime: story.readingTime || '',
      readingTimeMin: story.readingTimeMin || null,
      publishedAt: story.publishedAt || null,
    },
    progressPercent: progress.progressPercent ?? 0,
    furthestProgressPercent: progress.furthestProgressPercent ?? progress.progressPercent ?? 0,
    lastPosition: progress.lastPosition ?? 0,
    activeReadingSeconds: progress.activeReadingSeconds ?? 0,
    isCompleted: Boolean(progress.isCompleted),
    completedAt: progress.completedAt || null,
    completionSource: progress.completionSource || null,
    lastReadAt: progress.lastReadAt || null,
    // Stories link to /stories/:slug — not /articles/:slug
    continueUrl: `/stories/${story.slug}`,
  };
};

/**
 * Populate a ReadingProgress query with Story (contentType: 'story') data.
 * The contentType filter here is the safety gate that prevents Story progress
 * records from accidentally resolving Article documents and vice versa.
 */
const populateOwnedStory = (query) => query.populate({
  path: 'articleId',
  match: { contentType: 'story', status: 'published', isDeleted: false },
  select: STORY_FIELDS,
});

class StoryProgressService {
  /**
   * Persist one meaningful periodic update for a Story read session.
   *
   * CRITICAL: This method validates contentType: 'story' on the Article lookup.
   * If the articleId resolves to a non-story document, it throws 404.
   * It NEVER calls onArticleCompleted (which would increment Article streak/counters).
   */
  static async updateStoryProgress(data = {}) {
    const userId = asObjectId(data.userId, 'userId');
    const articleId = asObjectId(data.articleId, 'articleId');
    const progressPercent = numberInRange(
      data.progressPercent ?? 0,
      'progressPercent',
      0,
      100
    );
    const lastPosition = numberInRange(
      data.lastPosition ?? 0,
      'lastPosition',
      0,
      Number.MAX_SAFE_INTEGER
    );
    const activeReadingSeconds = numberInRange(
      data.activeReadingSeconds ?? 0,
      'activeReadingSeconds',
      0,
      MAX_ACTIVE_SECONDS_PER_UPDATE
    );

    // Safety gate: only allow progress updates for published stories.
    // contentType: 'story' filter prevents this service from writing progress
    // for Articles even if an articleId is accidentally passed in.
    const story = await Article.findOne({
      _id: articleId,
      contentType: 'story',
      status: 'published',
      isDeleted: false,
    }).select('_id').lean();
    if (!story) throw storyError('Published Story not found.', 404);

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
        // NOTE: onStoryCompleted intentionally does NOT touch ReaderProfile
        // Article counters, streaks, or AchievementService.
        // Story-specific completion analytics (e.g. StoryProfile.totalStoriesRead)
        // will be added in a future phase when that model exists.
      }
    }

    return StoryProgressService.getStoryProgress(userId, articleId);
  }

  static async getStoryProgress(userId, articleId) {
    const owned = await populateOwnedStory(
      ReadingProgress.findOne({
        userId: asObjectId(userId, 'userId'),
        articleId: asObjectId(articleId, 'articleId'),
      })
    ).lean();
    return serializeStoryProgress(owned);
  }

  /**
   * Returns in-progress stories for Continue Reading.
   * The populateOwnedStory filter ensures only contentType:'story' documents
   * are returned — Article progress records are silently excluded.
   */
  static async getStoryContinueReading(userId) {
    const rows = await populateOwnedStory(
      ReadingProgress.find({ userId: asObjectId(userId, 'userId'), isCompleted: false })
        .sort({ lastReadAt: -1 })
        .limit(12)
    ).lean();
    return rows.map(serializeStoryProgress).filter(Boolean).slice(0, 6);
  }

  static async getStoryCompleted(userId) {
    const rows = await populateOwnedStory(
      ReadingProgress.find({
        userId: asObjectId(userId, 'userId'),
        isCompleted: true,
        completedAt: { $ne: null },
      })
        .sort({ completedAt: -1 })
        .limit(24)
    ).lean();
    return rows.map(serializeStoryProgress).filter(Boolean).slice(0, 12);
  }
}

StoryProgressService.AUTO_COMPLETION_PERCENT = AUTO_COMPLETION_PERCENT;

module.exports = StoryProgressService;
