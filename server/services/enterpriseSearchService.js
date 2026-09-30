/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  enterpriseSearchService.js  —  Universal Search Engine & Discovery Platform
 *  MyJourney Platform  |  Phase 28: Global Search / Discovery / Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SearchIndex = require('../models/SearchIndex');
const Article = require('../models/Article');
const Page = require('../models/Page');
const Course = require('../models/Course');
const CreatorProfile = require('../models/CreatorProfile');
const CourseEnrollment = require('../models/CourseEnrollment');
const KnowledgeGraphService = require('./knowledgeGraphService');
const SEOService = require('./seoService');
const { escapeRegex } = require('../creators/utils');
const { isStoryRecord } = require('../utils/storyContent');

const VALID_ENTITY_TYPES = ['all', 'article', 'story', 'page', 'course', 'coding', 'creator', 'game'];

const boundedInteger = (value, fallback, maximum) =>
  Math.min(maximum, Math.max(1, Number.parseInt(value, 10) || fallback));

const normalizeQuery = (value) =>
  typeof value === 'string' ? value.trim().slice(0, 100) : '';

const articleProjection = {
  _id: 0,
  entityId: { $toString: '$_id' },
  entityType: {
    $cond: [
      {
        $or: [
          { $eq: ['$contentType', 'story'] },
          { $and: [{ $eq: [{ $ifNull: ['$contentType', null] }, null] }, { $eq: ['$category', 'Stories'] }] },
        ],
      },
      'story',
      'article',
    ],
  },
  title: 1,
  slug: 1,
  category: 1,
  tags: 1,
  author: 1,
  excerpt: { $ifNull: ['$description', '$excerpt'] },
  accessLevel: { $ifNull: ['$accessLevel', 'free'] },
  views: { $ifNull: ['$views', 0] },
};

const pageProjection = {
  _id: 0,
  entityId: { $toString: '$_id' },
  entityType: { $literal: 'page' },
  title: 1,
  slug: 1,
  category: { $literal: 'Page' },
  tags: { $literal: [] },
  author: { $literal: 'MyJourney' },
  excerpt: '$seo.metaDescription',
  accessLevel: { $literal: 'free' },
  views: { $ifNull: ['$views', 0] },
};

const courseProjection = {
  _id: 0,
  entityId: { $toString: '$_id' },
  entityType: { $cond: [{ $eq: ['$isSystemOwned', true] }, 'coding', 'course'] },
  title: 1,
  slug: 1,
  category: { $cond: [{ $eq: ['$isSystemOwned', true] }, 'Coding Track', { $ifNull: ['$level', 'Course'] }] },
  tags: { $ifNull: ['$learningOutcomes', []] },
  author: { $literal: 'MyJourney' },
  excerpt: { $ifNull: ['$subtitle', '$description'] },
  accessLevel: { $ifNull: ['$accessLevel', 'free'] },
  views: { $literal: 0 },
};

const creatorProjection = {
  _id: 0,
  entityId: { $toString: '$_id' },
  entityType: { $literal: 'creator' },
  title: '$displayName',
  slug: 1,
  category: { $literal: 'Creator' },
  tags: { $ifNull: ['$specialties', []] },
  author: '$displayName',
  excerpt: { $ifNull: ['$headline', '$biography'] },
  accessLevel: { $literal: 'free' },
  views: { $literal: 0 },
};

const withRoute = (item) => {
  let url = '/';
  if (item.entityType === 'page') {
    url = item.slug === 'home' ? '/' : `/${encodeURIComponent(item.slug)}`;
  } else if (item.entityType === 'story') {
    url = `/stories/${encodeURIComponent(item.slug)}`;
  } else if (item.entityType === 'article') {
    url = `/articles/${encodeURIComponent(item.slug)}`;
  } else if (item.entityType === 'coding') {
    url = `/coding/${encodeURIComponent(item.slug)}`;
  } else if (item.entityType === 'course') {
    url = `/learn/courses/${encodeURIComponent(item.slug)}`;
  } else if (item.entityType === 'creator') {
    url = `/creators/${encodeURIComponent(item.slug)}`;
  } else if (item.entityType === 'game') {
    url = item.url || `/play/${encodeURIComponent(item.slug)}`;
  }
  return { ...item, url };
};

const CANONICAL_PLAY_GAMES = [
  {
    entityId: 'game-play-life',
    entityType: 'game',
    title: 'Play Life',
    slug: 'play-life',
    category: 'Solo Reflection',
    tags: ['reflection', 'mood', 'mindfulness', 'game'],
    author: 'MyJourney',
    excerpt: 'An atmospheric, reflective scene engine tailored to your current emotional state with zero database mutation and complete privacy.',
    accessLevel: 'free',
    views: 120,
    url: '/play-life',
  },
  {
    entityId: 'game-this-or-that',
    entityType: 'game',
    title: 'This or That: Life Choices',
    slug: 'this-or-that',
    category: 'Solo Dilemmas',
    tags: ['dilemma', 'choices', 'philosophy', 'game'],
    author: 'MyJourney',
    excerpt: 'Ten swift, thought-provoking philosophical dilemmas and lifestyle trade-offs. Discover your hidden decision tendencies.',
    accessLevel: 'free',
    views: 95,
    url: '/play/this-or-that',
  },
  {
    entityId: 'game-who-knows-me-better',
    entityType: 'game',
    title: 'Who Knows Me Better?',
    slug: 'who-knows-me-better',
    category: 'Multiplayer Party',
    tags: ['party', 'social', 'multiplayer', 'trivia', 'game'],
    author: 'MyJourney',
    excerpt: 'One host, multiple friends. The host locks in personal truths, and friends race against the timer to guess the real answer.',
    accessLevel: 'free',
    views: 110,
    url: '/play-with-friends',
  },
  {
    entityId: 'game-life-auction',
    entityType: 'game',
    title: 'Life Auction',
    slug: 'life-auction',
    category: 'Multiplayer Strategy',
    tags: ['auction', 'bidding', 'strategy', 'multiplayer', 'game'],
    author: 'MyJourney',
    excerpt: 'Multiplayer strategic bidding game where players allocate virtual Life Coins across philosophical life values.',
    accessLevel: 'free',
    views: 85,
    url: '/play/life-auction',
  },
  {
    entityId: 'game-rapid-reflections',
    entityType: 'game',
    title: 'Rapid Reflections',
    slug: 'rapid-reflections',
    category: 'Solo Reflection',
    tags: ['prompts', 'speed', 'reflection', 'game'],
    author: 'MyJourney',
    excerpt: 'Fast-paced prompt engine offering swift personal reflection and cognitive insights.',
    accessLevel: 'free',
    views: 70,
    url: '/play/rapid-reflections',
  },
];

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
    if (!normalizedQuery || !VALID_ENTITY_TYPES.includes(entityType)) return empty;

    const regex = new RegExp(`${options.autocomplete ? '^' : ''}${escapeRegex(normalizedQuery)}`, 'i');

    const shouldQueryArticles = ['all', 'article', 'story'].includes(entityType);
    const shouldQueryPages = ['all', 'page'].includes(entityType);
    const shouldQueryCourses = ['all', 'course', 'coding'].includes(entityType);
    const shouldQueryCreators = ['all', 'creator'].includes(entityType);
    const shouldQueryGames = ['all', 'game'].includes(entityType);

    // Matching in-memory games
    const matchingGames = shouldQueryGames
      ? CANONICAL_PLAY_GAMES.filter((g) => {
          if (options.autocomplete) return regex.test(g.title);
          return (
            regex.test(g.title) ||
            regex.test(g.excerpt) ||
            regex.test(g.category) ||
            (Array.isArray(g.tags) && g.tags.some((t) => regex.test(t)))
          );
        }).map(withRoute)
      : [];

    if (entityType === 'game') {
      const total = matchingGames.length;
      const results = matchingGames.slice((page - 1) * limit, page * limit);
      return { ...empty, results, total };
    }

    const pipeline = [];

    // 1. Articles & Stories
    if (shouldQueryArticles) {
      const articleMatch = {
        ...SEOService.publicArticleFilter(),
        $or: (options.autocomplete ? ['title'] : ['title', 'description', 'excerpt', 'tags', 'category', 'author'])
          .map((field) => ({ [field]: regex })),
      };
      if (entityType === 'story') {
        articleMatch.$and = [
          {
            $or: [
              { contentType: 'story' },
              { $and: [{ contentType: null }, { category: 'Stories' }] },
            ],
          },
        ];
      } else if (entityType === 'article') {
        articleMatch.contentType = 'article';
      }
      pipeline.push({ $match: articleMatch }, { $project: articleProjection });
    } else {
      pipeline.push({ $match: { _id: null } }, { $project: articleProjection });
    }

    // 2. Pages
    if (shouldQueryPages) {
      const pageMatch = {
        ...SEOService.publicPageFilter(),
        $or: (options.autocomplete ? ['title'] : ['title', 'seo.metaDescription']).map((field) => ({ [field]: regex })),
      };
      pipeline.push({
        $unionWith: { coll: Page.collection.name, pipeline: [{ $match: pageMatch }, { $project: pageProjection }] },
      });
    }

    // 3. Courses & Coding
    if (shouldQueryCourses) {
      const courseMatch = {
        publicationStatus: 'published',
        isDeleted: false,
        $or: (options.autocomplete ? ['title'] : ['title', 'subtitle', 'description', 'language']).map((f) => ({ [f]: regex })),
      };
      if (entityType === 'coding') {
        courseMatch.isSystemOwned = true;
      } else if (entityType === 'course') {
        courseMatch.isSystemOwned = { $ne: true };
      }
      pipeline.push({
        $unionWith: { coll: Course.collection.name, pipeline: [{ $match: courseMatch }, { $project: courseProjection }] },
      });
    }

    // 4. Creators
    if (shouldQueryCreators) {
      const creatorMatch = {
        status: { $in: ['approved', 'active'] },
        $or: (options.autocomplete ? ['displayName'] : ['displayName', 'headline', 'biography', 'specialties']).map((f) => ({ [f]: regex })),
      };
      pipeline.push({
        $unionWith: { coll: CreatorProfile.collection.name, pipeline: [{ $match: creatorMatch }, { $project: creatorProjection }] },
      });
    }

    // If there are no games, use native MongoDB facet for pagination
    if (matchingGames.length === 0) {
      pipeline.push({
        $facet: {
          results: [{ $sort: { views: -1, title: 1, entityId: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
          count: [{ $count: 'total' }],
        },
      });
      const [result] = await Article.aggregate(pipeline).option({ maxTimeMS: 2000 });
      return {
        ...empty,
        results: (result?.results || []).map(withRoute),
        total: result?.count?.[0]?.total || 0,
      };
    }

    // When games also match, pull DB results and merge
    pipeline.push({ $sort: { views: -1, title: 1, entityId: 1 } });
    const dbResults = await Article.aggregate(pipeline).option({ maxTimeMS: 2000 });
    const formattedDb = (dbResults || []).map(withRoute);
    const combined = [...formattedDb, ...matchingGames].sort((a, b) => (b.views || 0) - (a.views || 0) || a.title.localeCompare(b.title));
    const total = combined.length;
    const paginated = combined.slice((page - 1) * limit, page * limit);

    return {
      ...empty,
      results: paginated,
      total,
    };
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
   * Home Discovery & Personalization Endpoint.
   * Strictly zero-knowledge regarding private Life OS records.
   */
  static async getHomeDiscovery(userId) {
    let continueLearning = [];

    if (userId) {
      try {
        const enrollments = await CourseEnrollment.find({ userId, status: 'active' })
          .populate('courseId', 'title slug isSystemOwned level accessLevel coverImage lessonCount')
          .populate('currentLessonId', 'title')
          .sort({ lastActivityAt: -1 })
          .limit(3)
          .lean();

        continueLearning = (enrollments || [])
          .filter((e) => e.courseId && !e.courseId.isDeleted)
          .map((e) => {
            const course = e.courseId;
            const total = course.lessonCount || 1;
            const completed = e.completedLessonCount || (Array.isArray(e.lessonProgress) ? e.lessonProgress.filter((lp) => lp.completedAt).length : 0);
            const progressPercent = Math.min(100, Math.round((completed / total) * 100));
            const isCoding = Boolean(course.isSystemOwned);
            return {
              courseId: String(course._id),
              title: course.title,
              slug: course.slug,
              route: isCoding ? `/coding/${course.slug}` : `/learn/courses/${course.slug}`,
              category: isCoding ? 'Coding Track' : (course.level || 'Course'),
              progressPercent,
              nextLesson: e.currentLessonId ? { title: e.currentLessonId.title } : null,
              lastActivityAt: e.lastActivityAt,
            };
          });
      } catch (_) {
        continueLearning = [];
      }
    }

    // Recommended public articles
    let recommendedContent = [];
    try {
      const articles = await Article.find(SEOService.publicArticleFilter())
        .select('title slug category tags description excerpt coverImage views accessLevel contentType')
        .sort({ views: -1, createdAt: -1 })
        .limit(4)
        .lean();

      recommendedContent = (articles || []).map((a) => ({
        entityId: String(a._id),
        entityType: a.contentType === 'story' ? 'story' : 'article',
        title: a.title,
        slug: a.slug,
        route: `/${a.contentType === 'story' ? 'stories' : 'articles'}/${encodeURIComponent(a.slug)}`,
        category: a.category || 'General',
        excerpt: a.description || a.excerpt || '',
        coverImage: a.coverImage || null,
        accessLevel: a.accessLevel || 'free',
      }));
    } catch (_) {
      recommendedContent = [];
    }

    const featuredEngines = [
      {
        id: 'engine-read',
        title: 'Editorial Reader',
        category: 'Read',
        description: 'Distraction-free reading with typography controls, dark mode, and audio narration.',
        route: '/articles',
        badge: 'Core Engine',
      },
      {
        id: 'engine-coding',
        title: 'Coding Playground',
        category: 'Learn',
        description: 'Interactive IDE with Web and Python sandboxes, splitters, and output preview.',
        route: '/coding/playground',
        badge: 'Interactive',
      },
      {
        id: 'engine-play',
        title: 'Play Hub & Games',
        category: 'Play',
        description: 'Solo reflection games and real-time multiplayer party games.',
        route: '/play',
        badge: 'Social & Solo',
      },
      {
        id: 'engine-creators',
        title: 'Creator Studio',
        category: 'Create',
        description: 'Author, publish, and monetize original courses and media.',
        route: '/creator-studio',
        badge: 'Community',
      },
    ];

    const trendingTopics = [
      { name: 'Technology', count: 12, route: '/category/technology' },
      { name: 'Philosophy', count: 8, route: '/category/philosophy' },
      { name: 'Engineering', count: 15, route: '/category/engineering' },
      { name: 'Mindset', count: 9, route: '/category/mindset' },
    ];

    return {
      isAuthenticated: Boolean(userId),
      continueLearning,
      recommendedContent,
      featuredEngines,
      trendingTopics,
    };
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
