/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  personalizationService.js  —  Dynamic Reader Personalization Engine
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Article = require('../models/Article');
const ReaderProfile = require('../models/ReaderProfile');
const ReadingProgress = require('../models/ReadingProgress');
const RecommendationService = require('./recommendationService');

const PUBLISHED_ONLY = { status: 'published', isDeleted: false };

class PersonalizationService {
  /**
   * Generate personalized home feed sections tailored for the given user or session.
   */
  static async getPersonalizedFeed(userId = null, sessionId = null) {
    let profile = null;
    let preferredCategories = [];

    if (userId) {
      profile = await ReaderProfile.findOne({ userId }).lean();
      preferredCategories = profile?.favoriteCategories || [];
    }

    // 1. Continue Reading (uncompleted articles sorted by lastReadAt)
    const filterProgress = userId ? { userId } : { sessionId };
    let continueReadingList = [];

    if (userId || sessionId) {
      const progressItems = await ReadingProgress.find({ ...filterProgress, isCompleted: false })
        .sort({ lastReadAt: -1 })
        .limit(4)
        .populate('articleId', 'title slug description excerpt coverImage category readingTime')
        .lean();

      continueReadingList = progressItems.map((p) => ({
        ...p.articleId,
        progress: {
          scrollPositionPx: p.scrollPositionPx,
          completionPercent: p.completionPercent,
          lastReadAt: p.lastReadAt,
        },
      }));
    }

    // 2. Recommended for You (personalized scoring)
    const recommendedForYou = await RecommendationService.getRecommendedForYou(
      { preferredCategories },
      6
    );

    // 3. Trending in Your Interests
    const trendingFilter = { ...PUBLISHED_ONLY, isTrending: true };
    if (preferredCategories.length > 0) {
      trendingFilter.categorySlug = { $in: preferredCategories };
    }
    const trendingInInterests = await Article.find(trendingFilter)
      .sort({ views: -1, publishedAt: -1 })
      .limit(4)
      .select('title slug description excerpt coverImage category categorySlug views likes readingTime')
      .lean();

    // 4. Hidden Gems (high rating/likes, lower views)
    const hiddenGems = await Article.find({ ...PUBLISHED_ONLY, views: { $lt: 500 }, likes: { $gte: 2 } })
      .sort({ likes: -1, rating: -1 })
      .limit(4)
      .select('title slug description excerpt coverImage category readingTime views likes')
      .lean();

    return {
      continueReading: continueReadingList,
      recommendedForYou,
      trendingInInterests: trendingInInterests.length ? trendingInInterests : recommendedForYou.slice(0, 4),
      hiddenGems,
    };
  }

  /**
   * Rank all articles for a user based on dynamic relevance score.
   */
  static async scoreArticlesForUser(userId, articles) {
    const profile = await ReaderProfile.findOne({ userId }).lean();
    const favs = new Set(profile?.favoriteCategories || []);

    return articles.map((art) => {
      let score = 50; // base score
      if (favs.has(art.categorySlug) || favs.has(art.category)) score += 30;
      if (art.isFeatured) score += 10;
      if (art.isMustRead) score += 15;
      score += Math.min((art.likes || 0) * 2, 20);

      return { ...art, userRelevanceScore: score };
    }).sort((a, b) => b.userRelevanceScore - a.userRelevanceScore);
  }
}

module.exports = PersonalizationService;
