/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  recommendationController.js  —  Recommendation API Controller
 *  MyJourney CMS  |  Stage 3 — Phase 20: Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RecommendationService = require('../services/recommendationService');
const { serializePublicContent } = require('../premium/contentPreview');

exports.getRecommendations = async (req, res) => {
  try {
    const { strategy, articleId, categorySlug } = req.query;
    const limit = Math.min(12, Math.max(1, Number.parseInt(req.query.limit, 10) || 4));

    let data = [];
    if (strategy === 'related' && articleId) {
      data = await RecommendationService.getRelatedArticles(articleId, limit);
    } else if (strategy === 'popular') {
      data = await RecommendationService.getPopularInCategory(categorySlug, limit);
    } else {
      data = await RecommendationService.getRecommendedForYou({ preferredCategories: categorySlug ? [categorySlug] : [] }, limit);
    }

    res.json({ success: true, data: data.map((article) => serializePublicContent(article, { listing: true })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations', message: err.message });
  }
};
