/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  enterpriseSearchService.js  —  Universal Search Engine & Indexer
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SearchIndex = require('../models/SearchIndex');
const Article = require('../models/Article');
const Page = require('../models/Page');
const KnowledgeGraphService = require('./knowledgeGraphService');
const SEOService = require('./seoService');
const { escapeRegex } = require('../creators/utils');
const { isStoryRecord } = require('../utils/storyContent');

const boundedInteger = (value, fallback, maximum) => Math.min(maximum, Math.max(1, Number.parseInt(value, 10) || fallback));
const normalizeQuery = (value) => typeof value === 'string' ? value.trim().slice(0, 100) : '';
const articleProjection = {
  _id: 0,
  entityId: { $toString: '$_id' },
  entityType: { $cond: [{ $or: [
    { $eq: ['$contentType', 'story'] },
    { $and: [{ $eq: [{ $ifNull: ['$contentType', null] }, null] }, { $eq: ['$category', 'Stories'] }] },
  ] }, 'story', 'article'] },
  title: 1, slug: 1, category: 1, tags: 1, author: 1,
  excerpt: { $ifNull: ['$description', '$excerpt'] },
  accessLevel: { $ifNull: ['$accessLevel', 'free'] },
  views: { $ifNull: ['$views', 0] },
};
const pageProjection = {
  _id: 0,
  entityId: { $toString: '$_id' }, entityType: { $literal: 'page' },
  title: 1, slug: 1, excerpt: '$seo.metaDescription',
  accessLevel: { $literal: 'free' }, views: { $ifNull: ['$views', 0] },
};
const withRoute = (item) => ({
  ...item,
  url: item.entityType === 'page'
    ? item.slug === 'home' ? '/' : `/${encodeURIComponent(item.slug)}`
    : `/${item.entityType === 'story' ? 'stories' : 'articles'}/${encodeURIComponent(item.slug)}`,
});

class EnterpriseSearchService {
  /**
   * Perform Universal Search across all indexed content types.
   */
  static async search(query, options = {}) {
    const normalizedQuery = normalizeQuery(query);
    const entityType = options.entityType || 'all';
    const limit = boundedInteger(options.limit, 10, 48);
    const page = boundedInteger(options.page, 1, 200);
    const empty = { query: normalizedQuery, results: [], total: 0, page, limit };
    if (!normalizedQuery || !['all', 'article', 'story', 'page'].includes(entityType)) return empty;

    // Search current public metadata in the existing source collections. A
    // stale SearchIndex snapshot must never grant access, reveal a withdrawn
    // title, or make protected body text searchable after an access change.
    const regex = new RegExp(`${options.autocomplete ? '^' : ''}${escapeRegex(normalizedQuery)}`, 'i');
    const articleMatch = {
      ...SEOService.publicArticleFilter(),
      $or: (options.autocomplete ? ['title'] : ['title', 'description', 'excerpt', 'tags', 'category', 'author'])
        .map((field) => ({ [field]: regex })),
    };
    const pageMatch = {
      ...SEOService.publicPageFilter(),
      $or: (options.autocomplete ? ['title'] : ['title', 'seo.metaDescription']).map((field) => ({ [field]: regex })),
    };
    const pipeline = [
      { $match: articleMatch },
      { $project: articleProjection },
      { $unionWith: { coll: Page.collection.name, pipeline: [{ $match: pageMatch }, { $project: pageProjection }] } },
      ...(entityType === 'all' ? [] : [{ $match: { entityType } }]),
      { $facet: {
        results: [{ $sort: { views: -1, title: 1, entityId: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
        count: [{ $count: 'total' }],
      } },
    ];
    const [result] = await Article.aggregate(pipeline).option({ maxTimeMS: 2000 });
    return { ...empty, results: (result?.results || []).map(withRoute), total: result?.count?.[0]?.total || 0 };
  }

  /**
   * Instant Autocomplete Suggestions.
   */
  static async autocomplete(prefix) {
    if (normalizeQuery(prefix).length < 2) return [];
    const result = await EnterpriseSearchService.search(prefix, { limit: 6, autocomplete: true });
    return result.results.map(({ title, entityType, slug, url }) => ({ title, entityType, slug, url }));
  }

  /**
   * Re-index all published articles into SearchIndex & KnowledgeGraph.
   */
  static async reindexAll() {
    const articles = await Article.find(SEOService.publicArticleFilter()).lean();

    // Clear old index
    await SearchIndex.deleteMany({ entityType: 'article' });

    const indexRecords = [];
    for (const art of articles) {
      const accessLevel = art.accessLevel === 'premium' ? 'premium' : 'free';
      const plainText = accessLevel === 'premium' ? '' : '';

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
        url: `/${isStoryRecord(art) ? 'stories' : 'articles'}/${encodeURIComponent(art.slug)}`,
        accessLevel,
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
