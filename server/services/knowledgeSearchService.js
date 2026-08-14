/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  knowledgeSearchService.js  —  RAG Knowledge Retrieval Engine
 *  MyJourney CMS  |  Stage 3 — Phase 20B: AI Knowledge Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The most important backend component of the AI assistant.
 *  Retrieves semantically relevant content from PUBLISHED articles only.
 *
 *  Evolution path (no breaking changes required):
 *    Phase 1 (current): MongoDB full-text search with weighted scoring
 *    Phase 2 (future):  Add cosine similarity on embedding vectors
 *    Phase 3 (future):  Hybrid: full-text + semantic with Reciprocal Rank Fusion
 *
 *  CONTENT SAFETY:
 *    ✓ Only searches status === 'published' articles
 *    ✓ Only searches isDeleted === false articles
 *    ✓ Never accesses drafts, scheduled, workflow, or private content
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Article = require('../models/Article');
const KnowledgeChunk = require('../models/KnowledgeChunk');

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RESULTS          = 6;   // Max articles returned per search
const MAX_CONTEXT_CHARS    = 4000; // Max chars sent to AI (fits in ~1000 tokens)
const CHUNK_SIZE_CHARS     = 600;  // Characters per knowledge chunk during indexing
const CHUNK_OVERLAP_CHARS  = 80;   // Overlap between adjacent chunks

// Safety filter — ALWAYS applied, never bypassed
const PUBLISHED_ONLY = { status: 'published', isDeleted: false, accessLevel: { $ne: 'premium' } };

// ─── Intent Detection ─────────────────────────────────────────────────────────

const INTENT_PATTERNS = {
  explain:    /\b(explain|what is|what are|how does|tell me about|define|describe)\b/i,
  recommend:  /\b(recommend|suggest|find|show me|best|top|list|give me)\b/i,
  summarize:  /\b(summarize|summary|tldr|brief|overview|quick)\b/i,
  compare:    /\b(compare|vs|versus|difference|better|which)\b/i,
  continue:   /\b(continue|next|more|what else|follow.?up|related)\b/i,
  quiz:       /\b(quiz|test|question|practice|challenge me)\b/i,
  learning:   /\b(learn|study|course|path|roadmap|getting started)\b/i,
  admin:      /\b(draft|analytics|cms|dashboard|article count|seo|traffic)\b/i,
};

/**
 * Detect the primary intent from a user query.
 * Returns the intent label and extracted keywords.
 */
function detectIntent(query) {
  const q = query.trim();
  let primaryIntent = 'general';

  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(q)) {
      primaryIntent = intent;
      break;
    }
  }

  // Extract meaningful keywords (remove stop words)
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'i', 'me', 'my', 'you', 'your',
    'it', 'its', 'we', 'our', 'they', 'their', 'this', 'that', 'these', 'those',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'about', 'into', 'through', 'between', 'how', 'what', 'when',
    'where', 'who', 'which', 'why', 'tell', 'me', 'give', 'show', 'explain',
    'please', 'help', 'need', 'want',
  ]);

  const keywords = q
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(0, 8);

  return { intent: primaryIntent, keywords };
}

// ─── Phase 1: Full-Text Search ────────────────────────────────────────────────

/**
 * Search published articles using MongoDB's full-text search index.
 * Returns articles with relevance scores, with the body stripped to excerpts.
 */
async function fullTextSearch(query, options = {}) {
  const { limit = MAX_RESULTS, category = null, excludeIds = [] } = options;

  const matchStage = {
    $text: { $search: query },
    ...PUBLISHED_ONLY,
  };

  if (category) matchStage.categorySlug = category;
  if (excludeIds.length > 0) matchStage._id = { $nin: excludeIds };

  const articles = await Article.aggregate([
    { $match: matchStage },
    { $addFields: { score: { $meta: 'textScore' } } },
    { $sort: { score: -1, views: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        description: 1,
        excerpt: 1,
        body: 1,
        category: 1,
        categorySlug: 1,
        tags: 1,
        readingTime: 1,
        views: 1,
        publishedAt: 1,
        score: 1,
      },
    },
  ]);

  return articles;
}

/**
 * Fallback regex search when text search returns no results.
 * Searches title and description only (faster, less precise).
 */
async function regexSearch(keywords, options = {}) {
  const { limit = MAX_RESULTS, category = null } = options;
  if (!keywords.length) return [];

  const regexPattern = keywords.join('|');
  const regex = new RegExp(regexPattern, 'i');

  const filter = {
    ...PUBLISHED_ONLY,
    $or: [{ title: regex }, { description: regex }, { tags: { $elemMatch: { $regex: regex } } }],
  };

  if (category) filter.categorySlug = category;

  return Article.find(filter)
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .select('title slug description excerpt body category categorySlug tags readingTime views publishedAt')
    .lean();
}

/**
 * Trending/popular articles (used when search returns nothing meaningful).
 */
async function popularArticles(options = {}) {
  const { limit = 4, category = null } = options;
  const filter = { ...PUBLISHED_ONLY };
  if (category) filter.categorySlug = category;

  return Article.find(filter)
    .sort({ views: -1, isFeatured: -1, publishedAt: -1 })
    .limit(limit)
    .select('title slug description excerpt category categorySlug tags readingTime views')
    .lean();
}

// ─── Context Builder ──────────────────────────────────────────────────────────

/**
 * Strip HTML tags from article body.
 */
function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Build the context block injected into the AI prompt.
 * Includes relevant excerpts from each retrieved article (budget-aware).
 */
function buildContext(articles, query) {
  if (!articles.length) return { contextText: '', citations: [] };

  const citations = [];
  const blocks = [];
  let totalChars = 0;

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const plainBody = stripHtml(a.body || '');
    const description = a.description || a.excerpt || '';

    // Find the most relevant passage within the body
    const relevantPassage = extractRelevantPassage(plainBody, query, 400);

    const block = [
      `--- SOURCE ${i + 1}: "${a.title}" (/${a.slug}) ---`,
      description ? `Summary: ${description.slice(0, 200)}` : '',
      relevantPassage ? `Content: ${relevantPassage}` : '',
      a.tags?.length ? `Tags: ${a.tags.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const blockChars = block.length;
    if (totalChars + blockChars > MAX_CONTEXT_CHARS) break;

    blocks.push(block);
    totalChars += blockChars;

    citations.push({
      articleId: a._id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      relevance: a.score ? Math.min(a.score / 10, 1) : 0.5,
    });
  }

  return {
    contextText: blocks.join('\n\n'),
    citations,
  };
}

/**
 * Extract the most relevant passage from body text around query keywords.
 */
function extractRelevantPassage(text, query, maxChars = 400) {
  if (!text || text.length <= maxChars) return text.slice(0, maxChars);

  // Find first occurrence of any query keyword
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  let bestPos = 0;

  for (const word of words) {
    const pos = text.toLowerCase().indexOf(word);
    if (pos !== -1) {
      bestPos = Math.max(0, pos - 60);
      break;
    }
  }

  return text.slice(bestPos, bestPos + maxChars).trim() + (text.length > bestPos + maxChars ? '…' : '');
}

// ─── Main Search API ─────────────────────────────────────────────────────────

class KnowledgeSearchService {
  /**
   * The main RAG search method.
   * Returns retrieved articles + formatted context for the AI prompt.
   *
   * @param {string} query       - User's question
   * @param {object} options
   * @param {string} [options.category]   - Filter by category slug
   * @param {string} [options.contextArticleSlug] - Current article the user is reading
   * @param {number} [options.limit]
   * @returns {{ articles, contextText, citations, intent, keywords, searchMethod }}
   */
  static async search(query, options = {}) {
    const { category = null, contextArticleSlug = null, limit = MAX_RESULTS } = options;

    // Step 1: Detect intent and extract keywords
    const { intent, keywords } = detectIntent(query);

    // Step 2: Try full-text search first
    let articles = [];
    let searchMethod = 'fulltext';

    try {
      articles = await fullTextSearch(query, { limit, category });
    } catch (err) {
      // Text index might not exist yet — fall through to regex
      console.warn('[KnowledgeSearch] Full-text search failed, falling back to regex:', err.message);
    }

    // Step 3: If full-text returns < 2 results, augment with regex search
    if (articles.length < 2) {
      searchMethod = 'regex';
      const regexResults = await regexSearch(keywords, { limit: limit - articles.length, category });
      // Deduplicate by _id
      const existingIds = new Set(articles.map((a) => a._id.toString()));
      articles = [...articles, ...regexResults.filter((a) => !existingIds.has(a._id.toString()))];
    }

    // Step 4: If still nothing, return popular articles as fallback
    let isPopularFallback = false;
    if (articles.length === 0) {
      searchMethod = 'popular';
      isPopularFallback = true;
      articles = await popularArticles({ limit: 4, category });
    }

    // Step 5: If user is reading a specific article, try to include it in context
    if (contextArticleSlug && articles.length < limit) {
      const contextArticle = await Article.findOne({ slug: contextArticleSlug, ...PUBLISHED_ONLY })
        .select('title slug description body category tags readingTime views publishedAt')
        .lean();
      if (contextArticle) {
        const alreadyIncluded = articles.some((a) => a.slug === contextArticleSlug);
        if (!alreadyIncluded) articles.unshift(contextArticle);
      }
    }

    // Step 6: Build AI context
    const { contextText, citations } = buildContext(articles, query);

    return {
      articles,
      contextText,
      citations,
      intent,
      keywords,
      searchMethod,
      isPopularFallback,
      totalFound: articles.length,
    };
  }

  /**
   * Index all published articles into KnowledgeChunk collection.
   * Call this after publishing an article or from the CMS Knowledge Index module.
   */
  static async indexArticle(articleId) {
    const article = await Article.findOne({ _id: articleId, ...PUBLISHED_ONLY }).lean();
    if (!article) {
      // Article not published — remove any existing chunks
      await KnowledgeChunk.deleteMany({ articleId });
      return { removed: true };
    }

    // Remove old chunks for this article
    await KnowledgeChunk.deleteMany({ articleId });

    const plainText = stripHtml(article.body || '');
    const chunks = chunkText(plainText, CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS);

    if (!chunks.length) return { chunksCreated: 0 };

    const docs = chunks.map((chunk, i) => ({
      articleId: article._id,
      articleTitle: article.title,
      articleSlug: article.slug,
      articleStatus: article.status,
      category: article.category,
      tags: article.tags || [],
      chunkIndex: i,
      content: chunk,
      charCount: chunk.length,
      indexedAt: new Date(),
    }));

    await KnowledgeChunk.insertMany(docs);
    return { chunksCreated: docs.length };
  }

  /**
   * Re-index all published articles.
   * Runs in background — returns a progress summary.
   */
  static async reindexAll() {
    await KnowledgeChunk.deleteMany({});
    const articles = await Article.find(PUBLISHED_ONLY).select('_id').lean();

    let total = 0;
    for (const { _id } of articles) {
      const result = await KnowledgeSearchService.indexArticle(_id);
      total += result.chunksCreated || 0;
    }

    return { articlesIndexed: articles.length, chunksCreated: total };
  }

  /**
   * Get index stats for the CMS Knowledge Index module.
   */
  static async getIndexStats() {
    const [chunkCount, articleCount, publishedCount] = await Promise.all([
      KnowledgeChunk.countDocuments(),
      KnowledgeChunk.distinct('articleId').then((ids) => ids.length),
      Article.countDocuments(PUBLISHED_ONLY),
    ]);

    const lastIndexed = await KnowledgeChunk.findOne().sort({ indexedAt: -1 }).select('indexedAt').lean();

    return {
      chunksIndexed: chunkCount,
      articlesIndexed: articleCount,
      publishedArticles: publishedCount,
      coveragePercent: publishedCount > 0 ? Math.round((articleCount / publishedCount) * 100) : 0,
      lastIndexedAt: lastIndexed?.indexedAt || null,
    };
  }
}

// ─── Text Chunking Helper ─────────────────────────────────────────────────────

function chunkText(text, chunkSize = CHUNK_SIZE_CHARS, overlap = CHUNK_OVERLAP_CHARS) {
  if (!text || text.length === 0) return [];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 20);
}

module.exports = KnowledgeSearchService;
