const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const Article = require('../models/Article');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const CourseLesson = require('../models/CourseLesson');
const CreatorProfile = require('../models/CreatorProfile');
const Page = require('../models/Page');
const searchService = require('../services/enterpriseSearchService');
const searchRoutes = require('../routes/searchRoutes');

const fixturePrefix = 'v1-global-search-';
const testMongoUri = 'mongodb://127.0.0.1:27017/myjourney_global_search_test';

describe('Phase 28 — Global Search, Discovery & Home Personalization', () => {
  let app;
  let testUserId;
  let codingCourseId;
  let learnCourseId;
  let creatorId;
  let lessonId;

  const cleanup = async () => {
    await Promise.all([
      Article.deleteMany({ slug: { $regex: `^${fixturePrefix}` } }),
      Course.deleteMany({ slug: { $regex: `^${fixturePrefix}` } }),
      CourseEnrollment.deleteMany({}),
      CourseLesson.deleteMany({ title: { $regex: `^${fixturePrefix}` } }),
      CreatorProfile.deleteMany({ slug: { $regex: `^${fixturePrefix}` } }),
      Page.deleteMany({ slug: { $regex: `^${fixturePrefix}` } }),
    ]);
  };

  beforeAll(async () => {
    jest.setTimeout(25000);
    if (process.env.NODE_ENV !== 'test' || !testMongoUri.endsWith('_test')) {
      throw new Error('Test requires an isolated test database.');
    }
    await mongoose.disconnect().catch(() => {});
    await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 8000, autoIndex: false });

    app = express();
    app.use(express.json());
    app.use('/api/search', searchRoutes);

    testUserId = new mongoose.Types.ObjectId();
    codingCourseId = new mongoose.Types.ObjectId();
    learnCourseId = new mongoose.Types.ObjectId();
    creatorId = new mongoose.Types.ObjectId();
    lessonId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await cleanup();
    } finally {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await cleanup();

    // 1. Articles & Stories
    await Article.collection.insertMany([
      {
        _id: new mongoose.Types.ObjectId(),
        slug: `${fixturePrefix}react-patterns`,
        title: 'Modern React Architecture Patterns',
        description: 'Deep dive into clean architecture in React applications.',
        body: 'SECRET_ARTICLE_BODY',
        status: 'published',
        contentType: 'article',
        category: 'Engineering',
        tags: ['react', 'frontend'],
        accessLevel: 'free',
        isDeleted: false,
        views: 150,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        slug: `${fixturePrefix}mountains-journey`,
        title: 'Reflections from the Himalayas',
        description: 'A personal story about mountaineering and resilience.',
        body: 'SECRET_STORY_BODY',
        status: 'published',
        contentType: 'story',
        category: 'Stories',
        tags: ['travel', 'mountains'],
        accessLevel: 'free',
        isDeleted: false,
        views: 120,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        slug: `${fixturePrefix}draft-article`,
        title: 'Draft Never Discovered Article',
        description: 'This is a draft.',
        body: 'DRAFT_SECRET',
        status: 'draft',
        contentType: 'article',
        isDeleted: false,
      },
    ]);

    // 2. Courses (Coding track vs standard Learn course)
    await Course.collection.insertMany([
      {
        _id: codingCourseId,
        creatorId: new mongoose.Types.ObjectId(),
        title: 'Fullstack JavaScript Foundations',
        slug: `${fixturePrefix}js-foundations`,
        subtitle: 'Build interactive web apps with JS',
        description: 'Interactive coding track covering ES6, DOM, and async programming.',
        language: 'JavaScript',
        level: 'beginner',
        accessLevel: 'free',
        publicationStatus: 'published',
        workflowStatus: 'approved',
        isSystemOwned: true,
        isDeleted: false,
        lessonCount: 10,
        rightsConfirmedAt: new Date(),
      },
      {
        _id: learnCourseId,
        creatorId,
        title: 'System Design for Distributed Systems',
        slug: `${fixturePrefix}system-design`,
        subtitle: 'Scale high-concurrency backends',
        description: 'Master partitioning, caching, message queues, and consensus.',
        language: 'English',
        level: 'advanced',
        accessLevel: 'premium',
        publicationStatus: 'published',
        workflowStatus: 'approved',
        isSystemOwned: false,
        isDeleted: false,
        lessonCount: 8,
        rightsConfirmedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        creatorId,
        title: 'Unpublished Python Draft Course',
        slug: `${fixturePrefix}unpublished-python`,
        description: 'Should never appear in search.',
        language: 'Python',
        publicationStatus: 'draft',
        workflowStatus: 'draft',
        isDeleted: false,
        rightsConfirmedAt: new Date(),
      },
    ]);

    // 3. Creator Profile
    await CreatorProfile.collection.insertOne({
      _id: creatorId,
      applicationId: new mongoose.Types.ObjectId(),
      displayName: 'Elena Rostova',
      slug: `${fixturePrefix}elena-rostova`,
      headline: 'Principal Distributed Systems Architect',
      biography: 'Author of enterprise engineering curricula with 15+ years experience.',
      status: 'active',
      specialties: ['Distributed Systems', 'Cloud'],
      isDeleted: false,
    });

    // 4. Course Lesson
    await CourseLesson.collection.insertOne({
      _id: lessonId,
      courseId: codingCourseId,
      moduleId: new mongoose.Types.ObjectId(),
      title: `${fixturePrefix}Closures and Scope`,
      lessonType: 'coding',
      order: 1,
      isDeleted: false,
    });
  });

  describe('1. Multi-Domain Universal Search', () => {
    test('searches published articles, stories, coding tracks, learn courses, creators, and play games', async () => {
      // Search 'React' -> Article
      const artRes = await request(app).get('/api/search').query({ q: 'React' }).expect(200);
      expect(artRes.body.data.results).toHaveLength(1);
      expect(artRes.body.data.results[0]).toMatchObject({
        entityType: 'article',
        title: 'Modern React Architecture Patterns',
        url: `/articles/${fixturePrefix}react-patterns`,
      });
      expect(artRes.text).not.toContain('SECRET_ARTICLE_BODY');

      // Search 'Himalayas' -> Story
      const storyRes = await request(app).get('/api/search').query({ q: 'Himalayas' }).expect(200);
      expect(storyRes.body.data.results).toHaveLength(1);
      expect(storyRes.body.data.results[0]).toMatchObject({
        entityType: 'story',
        title: 'Reflections from the Himalayas',
        url: `/stories/${fixturePrefix}mountains-journey`,
      });

      // Search 'JavaScript' -> Coding Track
      const jsRes = await request(app).get('/api/search').query({ q: 'JavaScript' }).expect(200);
      expect(jsRes.body.data.results).toHaveLength(1);
      expect(jsRes.body.data.results[0]).toMatchObject({
        entityType: 'coding',
        title: 'Fullstack JavaScript Foundations',
        category: 'Coding Track',
        url: `/coding/${fixturePrefix}js-foundations`,
      });

      // Search 'Distributed Systems' -> Course and Creator
      const distRes = await request(app).get('/api/search').query({ q: 'Distributed Systems' }).expect(200);
      expect(distRes.body.data.results.length).toBeGreaterThanOrEqual(1);
      const types = distRes.body.data.results.map((r) => r.entityType);
      expect(types).toContain('course');

      // Search 'Auction' -> Play Catalog Game
      const gameRes = await request(app).get('/api/search').query({ q: 'Auction' }).expect(200);
      expect(gameRes.body.data.results).toHaveLength(1);
      expect(gameRes.body.data.results[0]).toMatchObject({
        entityType: 'game',
        title: 'Life Auction',
        url: '/play/life-auction',
      });
    });

    test('entityType filter accurately isolates domain queries', async () => {
      // Filter for 'coding'
      const codingRes = await request(app)
        .get('/api/search')
        .query({ q: 'Foundations', type: 'coding' })
        .expect(200);
      expect(codingRes.body.data.results).toHaveLength(1);
      expect(codingRes.body.data.results[0].entityType).toBe('coding');

      // Filter for 'game'
      const gameRes = await request(app)
        .get('/api/search')
        .query({ q: 'Play', type: 'game' })
        .expect(200);
      expect(gameRes.body.data.results.length).toBeGreaterThanOrEqual(1);
      gameRes.body.data.results.forEach((item) => {
        expect(item.entityType).toBe('game');
      });

      // Filter for 'creator'
      const creatorRes = await request(app)
        .get('/api/search')
        .query({ q: 'Elena', type: 'creator' })
        .expect(200);
      expect(creatorRes.body.data.results).toHaveLength(1);
      expect(creatorRes.body.data.results[0]).toMatchObject({
        entityType: 'creator',
        title: 'Elena Rostova',
        url: `/creators/${fixturePrefix}elena-rostova`,
      });

      // Invalid entityType returns empty results gracefully
      const invalidRes = await request(app)
        .get('/api/search')
        .query({ q: 'React', type: 'user' })
        .expect(200);
      expect(invalidRes.body.data.total).toBe(0);
      expect(invalidRes.body.data.results).toEqual([]);
    });

    test('never reveals drafts, unpublished content, or private bodies', async () => {
      const res = await request(app).get('/api/search').query({ q: 'Draft Never Discovered' }).expect(200);
      expect(res.body.data.total).toBe(0);

      const pyRes = await request(app).get('/api/search').query({ q: 'Unpublished Python' }).expect(200);
      expect(pyRes.body.data.total).toBe(0);
    });

    test('handles input bounds, regex metacharacters, and pagination safely', async () => {
      // Special regex characters handled literally
      const regexRes = await request(app).get('/api/search').query({ q: '.*+?^${}()|[]\\' }).expect(200);
      expect(regexRes.body.data.total).toBe(0);

      // Long queries safely normalized
      const longQuery = 'a'.repeat(200);
      const longRes = await request(app).get('/api/search').query({ q: longQuery }).expect(200);
      expect(longRes.body.data.query.length).toBeLessThanOrEqual(100);

      // Autocomplete prefix
      const autoRes = await request(app).get('/api/search/autocomplete').query({ q: 'Mod' }).expect(200);
      expect(autoRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(autoRes.body.data[0]).toHaveProperty('title');
      expect(autoRes.body.data[0]).toHaveProperty('url');
    });
  });

  describe('2. Home Discovery & Personalization Endpoint', () => {
    test('unauthenticated visitor receives deterministic platform engines and public recommendations', async () => {
      const res = await request(app).get('/api/search/discovery/home').expect(200);

      expect(res.body.data).toMatchObject({
        isAuthenticated: false,
        continueLearning: [],
      });
      expect(res.body.data.featuredEngines.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data.trendingTopics.length).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(res.body.data.recommendedContent)).toBe(true);

      // Verified: no Life data exposed
      expect(res.text).not.toContain('lifeEntries');
      expect(res.text).not.toContain('journal');
    });

    test('authenticated learner receives real Continue Learning with progress percent', async () => {
      // Seed an active course enrollment
      await CourseEnrollment.create({
        userId: testUserId,
        courseId: codingCourseId,
        status: 'active',
        currentLessonId: lessonId,
        structuralVersionAtEnrollment: 1,
        completedLessonCount: 3,
        lastActivityAt: new Date(),
      });

      const discoveryData = await searchService.getHomeDiscovery(testUserId);
      expect(discoveryData.isAuthenticated).toBe(true);
      expect(discoveryData.continueLearning).toHaveLength(1);
      expect(discoveryData.continueLearning[0]).toMatchObject({
        courseId: String(codingCourseId),
        title: 'Fullstack JavaScript Foundations',
        route: `/coding/${fixturePrefix}js-foundations`,
        category: 'Coding Track',
        progressPercent: 30, // 3 of 10 completed = 30%
        nextLesson: { title: `${fixturePrefix}Closures and Scope` },
      });
    });

    test('strict zero-knowledge Life privacy isolation', async () => {
      // Verify EnterpriseSearchService never imports or invokes Life models
      const fs = require('fs');
      const searchServiceSource = fs.readFileSync('server/services/enterpriseSearchService.js', 'utf8');

      expect(searchServiceSource).not.toContain("require('../models/Life");
      expect(searchServiceSource).not.toContain("require('../life/");
      expect(searchServiceSource).not.toContain("LifeEntry");
      expect(searchServiceSource).not.toContain("LifeJournal");
    });
  });
});
