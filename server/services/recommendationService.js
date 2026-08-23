/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  recommendationService.js  —  Multi-Strategy Article Recommendation Engine
 *  MyJourney CMS  |  Stage 3 — Phase 20: Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Provides dynamic article recommendations using rule-based scoring, taxonomy match,
 *  popularity metrics, and reading history. Future-ready for vector embeddings.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Article = require('../models/Article');
const mongoose = require('mongoose');

const PUBLISHED_ONLY = { status: 'published', isDeleted: false };

class RecommendationService {
  /**
   * Related Articles — content similarity by category, subcategory, and tag overlap.
   */
  static async getRelatedArticles(articleId, limit = 4) {
    if (!mongoose.isValidObjectId(articleId)) return [];
    const sourceArticle = await Article.findOne({ _id: articleId, ...PUBLISHED_ONLY })
      .select('category subcategory tags')
      .lean();
    if (!sourceArticle) return [];

    const candidates = await Article.find({
      ...PUBLISHED_ONLY,
      _id: { $ne: sourceArticle._id },
      $or: [
        { category: sourceArticle.category },
        { tags: { $in: sourceArticle.tags || [] } },
      ],
    })
      .select('title slug description excerpt coverImage category categorySlug tags readingTime views likes publishedAt accessLevel contentType storyLayout')
      .limit(20)
      .lean();

    // Score candidates based on tag overlap and same category/subcategory
    const scored = candidates.map((candidate) => {
      let score = 0;
      if (candidate.category === sourceArticle.category) score += 5;
      if (candidate.subcategory && candidate.subcategory === sourceArticle.subcategory) score += 3;

      // Tag overlap
      const sharedTags = (candidate.tags || []).filter((t) => (sourceArticle.tags || []).includes(t));
      score += sharedTags.length * 2;

      // Popularity boost
      score += Math.min((candidate.views || 0) / 500, 2);

      return { ...candidate, recommendationScore: score };
    });

    return scored
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);
  }

  /**
   * Recommended For You — personalized based on category or trending metrics.
   */
  static async getRecommendedForYou(userPreferences = {}, limit = 6) {
    const { preferredCategories = [], bookmarkedIds = [] } = userPreferences;

    const filter = {
      ...PUBLISHED_ONLY,
      _id: { $nin: bookmarkedIds },
    };

    if (preferredCategories.length > 0) {
      filter.categorySlug = { $in: preferredCategories };
    }

    return Article.find(filter)
      .sort({ isMustRead: -1, isFeatured: -1, views: -1, publishedAt: -1 })
      .limit(limit)
      .select('title slug description excerpt coverImage category categorySlug tags readingTime views likes publishedAt accessLevel contentType storyLayout')
      .lean();
  }

  /**
   * Popular In Category.
   */
  static async getPopularInCategory(categorySlug, limit = 4) {
    const filter = { ...PUBLISHED_ONLY };
    if (categorySlug) filter.categorySlug = categorySlug;

    return Article.find(filter)
      .sort({ views: -1, likes: -1, publishedAt: -1 })
      .limit(limit)
      .select('title slug description excerpt coverImage category categorySlug readingTime views likes accessLevel contentType storyLayout')
      .lean();
  }
}

module.exports = RecommendationService;
