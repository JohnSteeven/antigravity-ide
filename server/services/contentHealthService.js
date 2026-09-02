/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  contentHealthService.js  —  0–100 Article Content Health & Quality Scoring
 *  MyJourney CMS  |  Stage 3 — Phase 20D: Editorial Advisor & Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Article = require('../models/Article');

class ContentHealthService {
  /**
   * Calculate 0-100 Content Health score for an article.
   *
   * Scoring Breakdown (100 pts max):
   *   - SEO Title & Description present: 20 pts
   *   - Word Count (>= 400 words): 20 pts
   *   - Cover Image present: 15 pts
   *   - Tags count (>= 3 tags): 10 pts
   *   - Freshness (updated within 90 days): 15 pts
   *   - Engagement (views > 50 or likes > 5): 20 pts
   */
  static calculateHealth(article) {
    if (!article) return { score: 0, status: 'Outdated', badges: [], details: {} };

    let score = 0;
    const checks = [];
    const badges = [];

    // 1. SEO (20 pts)
    const hasTitle = Boolean(article.seo?.title || article.title);
    const hasDesc = Boolean(article.seo?.description || article.description);
    if (hasTitle && hasDesc) {
      score += 20;
      checks.push({ name: 'SEO Meta', passed: true, points: 20 });
    } else {
      checks.push({ name: 'SEO Meta', passed: false, points: 0, issue: 'Missing title or description' });
    }

    // 2. Word Count (20 pts)
    const plainText = (article.body || '').replace(/<[^>]+>/g, ' ').trim();
    const wordCount = plainText ? plainText.split(/\s+/).length : 0;
    if (wordCount >= 400) {
      score += 20;
      checks.push({ name: 'Word Count', passed: true, points: 20, value: wordCount });
    } else if (wordCount >= 200) {
      score += 10;
      checks.push({ name: 'Word Count', passed: false, points: 10, value: wordCount, issue: 'Thin content (< 400 words)' });
    } else {
      checks.push({ name: 'Word Count', passed: false, points: 0, value: wordCount, issue: 'Very thin content (< 200 words)' });
    }

    // 3. Cover Image (15 pts)
    if (article.coverImage) {
      score += 15;
      checks.push({ name: 'Cover Image', passed: true, points: 15 });
    } else {
      checks.push({ name: 'Cover Image', passed: false, points: 0, issue: 'No cover image attached' });
    }

    // 4. Tags (10 pts)
    const tagCount = (article.tags || []).length;
    if (tagCount >= 3) {
      score += 10;
      checks.push({ name: 'Tag Taxonomy', passed: true, points: 10 });
    } else {
      checks.push({ name: 'Tag Taxonomy', passed: false, points: Math.min(tagCount * 3, 9), issue: 'Fewer than 3 tags' });
    }

    // 5. Freshness (15 pts)
    const lastUpdate = new Date(article.updatedAt || article.publishedAt || article.createdAt || Date.now());
    const daysOld = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld <= 90) {
      score += 15;
      checks.push({ name: 'Freshness', passed: true, points: 15, daysOld });
    } else if (daysOld <= 180) {
      score += 8;
      checks.push({ name: 'Freshness', passed: false, points: 8, daysOld, issue: 'Not updated in 3+ months' });
    } else {
      checks.push({ name: 'Freshness', passed: false, points: 0, daysOld, issue: 'Outdated (> 6 months old)' });
    }

    // 6. Engagement (20 pts)
    const views = article.views || 0;
    const likes = article.likes || 0;
    if (views >= 100 || likes >= 10) {
      score += 20;
      checks.push({ name: 'Reader Engagement', passed: true, points: 20 });
    } else if (views >= 20 || likes >= 2) {
      score += 10;
      checks.push({ name: 'Reader Engagement', passed: true, points: 10 });
    } else {
      checks.push({ name: 'Reader Engagement', passed: false, points: 0, issue: 'Low reader engagement' });
    }

    // Badges
    if (views >= 200 || likes >= 15) badges.push('Trending');
    if (daysOld <= 30 && wordCount >= 500) badges.push('Evergreen');
    if (daysOld > 180) badges.push('Outdated');
    if (wordCount < 200) badges.push('Thin Content');

    return {
      score: Math.min(score, 100),
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
      badges,
      wordCount,
      daysOld,
      checks,
    };
  }

  /**
   * Bulk score multiple articles.
   */
  static async scoreArticles(articleIds) {
    const articles = await Article.find({ _id: { $in: articleIds } }).lean();
    return articles.map((art) => ({
      articleId: art._id,
      title: art.title,
      health: ContentHealthService.calculateHealth(art),
    }));
  }
}

module.exports = ContentHealthService;
