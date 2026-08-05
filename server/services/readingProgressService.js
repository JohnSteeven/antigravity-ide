/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  readingProgressService.js  —  Continue Reading & Reading Tracker Engine
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ReadingProgress = require('../models/ReadingProgress');
const ReaderProfile = require('../models/ReaderProfile');
const AchievementService = require('./achievementService');

class ReadingProgressService {
  /**
   * Save or update scroll position & completion rate for an article.
   */
  static async updateProgress(data) {
    const { userId, sessionId, articleId, articleSlug, scrollPositionPx, completionPercent, timeSpentSeconds, deviceType } = data;

    if (!articleId) throw new Error('articleId is required.');

    const filter = userId ? { userId, articleId } : { sessionId, articleId };
    let progress = await ReadingProgress.findOne(filter);

    const isNewlyCompleted = !progress?.isCompleted && (completionPercent >= 80);

    if (!progress) {
      progress = new ReadingProgress({
        userId: userId || null,
        sessionId: sessionId || null,
        articleId,
        articleSlug,
        scrollPositionPx: scrollPositionPx || 0,
        completionPercent: completionPercent || 0,
        timeSpentSeconds: timeSpentSeconds || 0,
        deviceType: deviceType || 'desktop',
        isCompleted: completionPercent >= 80,
        lastReadAt: new Date(),
      });
    } else {
      progress.scrollPositionPx = Math.max(progress.scrollPositionPx, scrollPositionPx || 0);
      progress.completionPercent = Math.max(progress.completionPercent, completionPercent || 0);
      progress.timeSpentSeconds += timeSpentSeconds || 0;
      if (completionPercent >= 80) progress.isCompleted = true;
      progress.lastReadAt = new Date();
    }

    await progress.save();

    // If newly completed & logged in user, update ReaderProfile stats & streaks
    if (isNewlyCompleted && userId) {
      await ReadingProgressService.onArticleCompleted(userId);
    }

    return progress;
  }

  /**
   * Handler when an article is completed. Update streak and total count.
   */
  static async onArticleCompleted(userId) {
    let profile = await ReaderProfile.findOne({ userId });
    if (!profile) {
      profile = await ReaderProfile.create({ userId });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile.lastActiveDate ? new Date(profile.lastActiveDate).toISOString().split('T')[0] : null;

    profile.totalArticlesRead += 1;

    if (lastActive !== today) {
      // Check if yesterday
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        profile.currentStreakDays += 1;
      } else {
        profile.currentStreakDays = 1;
      }
      profile.longestStreakDays = Math.max(profile.longestStreakDays, profile.currentStreakDays);
      profile.lastActiveDate = new Date();
    }

    await profile.save();
    await AchievementService.evaluateAchievements(userId);
  }

  /**
   * Get Continue Reading list for a user/session.
   */
  static async getContinueReading(userId = null, sessionId = null) {
    const filter = userId ? { userId } : { sessionId };
    if (!userId && !sessionId) return [];

    return ReadingProgress.find({ ...filter, isCompleted: false })
      .sort({ lastReadAt: -1 })
      .limit(6)
      .populate('articleId', 'title slug description excerpt coverImage category readingTime')
      .lean();
  }
}

module.exports = ReadingProgressService;
