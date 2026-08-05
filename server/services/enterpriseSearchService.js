/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  enterpriseSearchService.js  —  Universal Search Engine & Indexer
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SearchIndex = require('../models/SearchIndex');
const Article = require('../models/Article');
const KnowledgeGraphService = require('./knowledgeGraphService');

class EnterpriseSearchService {
  /**
   * Perform Universal Search across all indexed content types.
   */
  static async search(query, options = {}) {
    const { entityType = 'all', limit = 10, page = 1 } = options;

    if (!query?.trim()) return { results: [], total: 0 };

    const filter = { isPublic: true };
    if (entityType !== 'all') filter.entityType = entityType;

    // 1. Primary Full-Text MongoDB Search
    let results = await SearchIndex.find(
      { $text: { $search: query }, ...filter },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' }, views: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 2. Regex Fallback if Text Index returns no results
    if (results.length === 0) {
      const regex = new RegExp(query.trim(), 'i');
      results = await SearchIndex.find({
        ...filter,
        $or: [{ title: regex }, { tags: regex }, { category: regex }, { content: regex }],
      })
        .limit(limit)
        .lean();
    }

    const total = await SearchIndex.countDocuments(filter);

    return {
      query,
      results,
      total,
      page,
      limit,
    };
  }

  /**
   * Instant Autocomplete Suggestions.
   */
  static async autocomplete(prefix) {
    if (!prefix || prefix.length < 2) return [];

    const regex = new RegExp(`^${prefix.trim()}`, 'i');
    return SearchIndex.find({ title: regex, isPublic: true })
      .select('title entityType slug url')
      .limit(6)
      .lean();
  }

  /**
   * Re-index all published articles into SearchIndex & KnowledgeGraph.
   */
  static async reindexAll() {
    const articles = await Article.find({ status: 'published', isDeleted: false }).lean();

    // Clear old index
    await SearchIndex.deleteMany({});

    const indexRecords = [];
    for (const art of articles) {
      const plainText = (art.body || '').replace(/<[^>]+>/g, ' ').slice(0, 5000);

      indexRecords.push({
        entityType: 'article',
        entityId: art._id.toString(),
        title: art.title,
        slug: art.slug,
        content: plainText,
        excerpt: art.description || art.excerpt || '',
        category: art.category || '',
        tags: art.tags || [],
        author: art.author || 'Publisher',
        url: `/articles/${art.slug}`,
        views: art.views || 0,
        likes: art.likes || 0,
      });

      // Build Knowledge Graph
      await KnowledgeGraphService.buildGraphForArticle(art);
    }

    if (indexRecords.length > 0) {
      await SearchIndex.insertMany(indexRecords);
    }

    return { indexedCount: indexRecords.length };
  }
}

module.exports = EnterpriseSearchService;
