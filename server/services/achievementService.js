/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  achievementService.js  —  Achievement & Gamification Engine
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ReaderProfile = require('../models/ReaderProfile');

const BADGES = [
  { key: 'first_article', title: 'First Steps', description: 'Read your first article on MyJourney', icon: 'award' },
  { key: '10_articles', title: 'Avid Reader', description: 'Read 10 articles on MyJourney', icon: 'book' },
  { key: '100_articles', title: 'Master Reader', description: 'Read 100 articles on MyJourney', icon: 'star' },
  { key: 'streak_7', title: '7-Day Streak', description: 'Read articles 7 days in a row', icon: 'zap' },
  { key: 'streak_30', title: '30-Day Streak', description: 'Read articles 30 days in a row', icon: 'flame' },
];

class AchievementService {
  /**
   * Evaluate and unlock achievements for a reader profile.
   */
  static async evaluateAchievements(userId) {
    const profile = await ReaderProfile.findOne({ userId });
    if (!profile) return [];

    const unlockedKeys = new Set(profile.achievements.map((a) => a.key));
    const newUnlocked = [];

    // Check conditions
    if (profile.totalArticlesRead >= 1 && !unlockedKeys.has('first_article')) {
      newUnlocked.push(BADGES.find((b) => b.key === 'first_article'));
    }
    if (profile.totalArticlesRead >= 10 && !unlockedKeys.has('10_articles')) {
      newUnlocked.push(BADGES.find((b) => b.key === '10_articles'));
    }
    if (profile.totalArticlesRead >= 100 && !unlockedKeys.has('100_articles')) {
      newUnlocked.push(BADGES.find((b) => b.key === '100_articles'));
    }
    if (profile.currentStreakDays >= 7 && !unlockedKeys.has('streak_7')) {
      newUnlocked.push(BADGES.find((b) => b.key === 'streak_7'));
    }
    if (profile.currentStreakDays >= 30 && !unlockedKeys.has('streak_30')) {
      newUnlocked.push(BADGES.find((b) => b.key === 'streak_30'));
    }

    if (newUnlocked.length > 0) {
      newUnlocked.forEach((badge) => {
        if (badge) profile.achievements.push({ ...badge, unlockedAt: new Date() });
      });
      await profile.save();
    }

    return newUnlocked;
  }
}

module.exports = AchievementService;
