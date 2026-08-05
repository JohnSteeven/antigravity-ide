/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  recommendationController.js  —  Recommendation API Controller
 *  MyJourney CMS  |  Stage 3 — Phase 20: Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RecommendationService = require('../services/recommendationService');

exports.getRecommendations = async (req, res) => {
  try {
    const { strategy, articleId, categorySlug, limit = 4 } = req.query;

    let data = [];
    if (strategy === 'related' && articleId) {
      data = await RecommendationService.getRelatedArticles(articleId, parseInt(limit));
    } else if (strategy === 'popular') {
      data = await RecommendationService.getPopularInCategory(categorySlug, parseInt(limit));
    } else {
      data = await RecommendationService.getRecommendedForYou({ preferredCategories: categorySlug ? [categorySlug] : [] }, parseInt(limit));
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations', message: err.message });
  }
};
