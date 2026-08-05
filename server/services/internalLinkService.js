/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  internalLinkService.js  —  Smart Internal Linking Engine
 *  MyJourney CMS  |  Stage 3 — Phase 20D: Editorial Advisor & Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Article = require('../models/Article');

const PUBLISHED_ONLY = { status: 'published', isDeleted: false };

class InternalLinkService {
  /**
   * Scan target article content and match against published articles to generate link recommendations.
   */
  static async suggestLinks(articleId, bodyText = '') {
    // Fetch all published articles except current one
    const otherArticles = await Article.find({
      ...PUBLISHED_ONLY,
      _id: { $ne: articleId },
    })
      .select('title slug category tags')
      .lean();

    if (!otherArticles.length) return [];

    const textLower = bodyText.toLowerCase();
    const suggestions = [];

    for (const target of otherArticles) {
      const titleLower = target.title.toLowerCase();
      // Simple match: check if target title or key tags appear in bodyText
      if (titleLower.length > 4 && textLower.includes(titleLower)) {
        suggestions.push({
          targetArticleId: target._id,
          title: target.title,
          slug: target.slug,
          category: target.category,
          matchedAnchor: target.title,
          relevanceScore: 0.9,
          reason: `Exact title match found in text`,
        });
      } else {
        // Tag match
        const matchingTags = (target.tags || []).filter(
          (t) => t.length > 3 && textLower.includes(t.toLowerCase())
        );
        if (matchingTags.length >= 2) {
          suggestions.push({
            targetArticleId: target._id,
            title: target.title,
            slug: target.slug,
            category: target.category,
            matchedAnchor: matchingTags.join(', '),
            relevanceScore: 0.7,
            reason: `Matched tags: ${matchingTags.join(', ')}`,
          });
        }
      }
    }

    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }
}

module.exports = InternalLinkService;
