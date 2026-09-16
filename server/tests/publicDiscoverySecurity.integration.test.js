const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const Article = require('../models/Article');
const Page = require('../models/Page');
const Category = require('../models/Category');
const SearchIndex = require('../models/SearchIndex');
const searchService = require('../services/enterpriseSearchService');
const SEOService = require('../services/seoService');
const seoController = require('../controllers/seoController');
const searchRoutes = require('../routes/searchRoutes');

const fixturePrefix = 'v1-discovery-security-';
const testMongoUri = 'mongodb://127.0.0.1:27017/myjourney_public_discovery_test';
const originalClientUrl = process.env.CLIENT_URL;
const ids = { article: new mongoose.Types.ObjectId(), story: new mongoose.Types.ObjectId(), legacy: new mongoose.Types.ObjectId() };
const fixturesFilter = { slug: { $regex: `^${fixturePrefix}` } };

describe('Public discovery source authority and SEO', () => {
  let app;

  const cleanup = async () => Promise.all([
    Article.deleteMany(fixturesFilter), Page.deleteMany(fixturesFilter), Category.deleteMany(fixturesFilter), SearchIndex.deleteMany(fixturesFilter),
  ]);

  beforeAll(async () => {
    jest.setTimeout(25000);
    if (process.env.NODE_ENV !== 'test' || !testMongoUri.endsWith('_test')) throw new Error('Discovery security tests require the isolated test database.');
    await mongoose.disconnect().catch(() => {});
    await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 8000, autoIndex: false });
    process.env.CLIENT_URL = 'https://myjourney.example';
    app = express();
    app.use('/api/search', searchRoutes);
    app.get('/sitemap.xml', seoController.getSitemap);
    app.get('/robots.txt', seoController.getRobotsTxt);
    app.get('/jsonld/:entityType/:entityId', seoController.getJsonLd);
    app.use((error, _req, res, _next) => res.status(error.status || 500).json({ code: error.code }));
  });

  beforeEach(async () => {
    await cleanup();
    await Article.collection.insertMany([
      { _id: ids.article, slug: `${fixturePrefix}article`, title: 'Discovery current Article', description: 'Public summary', body: 'PRIVATE_BODY_SENTINEL', status: 'published', contentType: 'article', accessLevel: 'premium', isDeleted: false, seo: {}, authorId: 'PRIVATE_AUTHOR_ID' },
      { _id: ids.story, slug: `${fixturePrefix}story`, title: 'Discovery current Story', status: 'published', contentType: 'story', isDeleted: false, seo: {} },
      { _id: ids.legacy, slug: `${fixturePrefix}legacy`, title: 'Discovery legacy Story', status: 'published', category: 'Stories', isDeleted: false, seo: {} },
    ]);
    await SearchIndex.collection.insertOne({ entityType: 'article', entityId: String(ids.article), slug: `${fixturePrefix}stale`, title: 'STALE_TITLE_SENTINEL', content: 'PRIVATE_BODY_SENTINEL', isPublic: true, accessLevel: 'free', url: '/article/old-location' });
  });

  afterAll(async () => {
    try { if (mongoose.connection.readyState === 1) await cleanup(); }
    finally {
      await mongoose.disconnect();
      if (originalClientUrl === undefined) delete process.env.CLIENT_URL;
      else process.env.CLIENT_URL = originalClientUrl;
    }
  });

  test('stale index bodies/titles cannot match or appear after Free becomes Premium', async () => {
    for (const query of ['PRIVATE_BODY_SENTINEL', 'STALE_TITLE_SENTINEL']) {
      const response = await request(app).get('/api/search').query({ q: query }).expect(200);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.results).toEqual([]);
    }
    const response = await request(app).get('/api/search').query({ q: 'Discovery current Article' }).expect(200);
    expect(response.body.data.results).toHaveLength(1);
    expect(response.body.data.results[0]).toMatchObject({ entityId: String(ids.article), accessLevel: 'premium', url: `/articles/${fixturePrefix}article` });
    expect(response.text).not.toContain('PRIVATE_BODY_SENTINEL');
    expect(response.text).not.toContain('PRIVATE_AUTHOR_ID');
    expect(response.body.data.results[0]).not.toHaveProperty('body');
    expect(response.body.data.results[0]).not.toHaveProperty('content');
  });

  test.each([{ status: 'draft' }, { status: 'archived' }, { isDeleted: true }, { 'seo.metaRobots': 'NoIndex, follow' }])('withdrawal immediately removes search/autocomplete and JSON-LD: %p', async (update) => {
    await Article.collection.updateOne({ _id: ids.article }, { $set: update });
    expect((await searchService.search('Discovery current Article')).total).toBe(0);
    expect(await searchService.autocomplete('Discovery current Article')).toEqual([]);
    await request(app).get(`/jsonld/article/${ids.article}`).expect(404);
  });

  test('Story discriminator and legacy Stories category generate valid public URLs', async () => {
    const result = await searchService.search('Discovery', { entityType: 'story' });
    expect(result.total).toBe(2);
    expect(result.results.map((item) => item.url).sort()).toEqual([`/stories/${fixturePrefix}legacy`, `/stories/${fixturePrefix}story`]);
    expect((await searchService.search('Discovery', { entityType: 'article' })).total).toBe(1);
  });

  test('public Page metadata is searchable while private, noindex, scheduled, expired, role and feature-gated pages are excluded', async () => {
    const variants = [
      {}, { visibility: 'private' }, { visibility: 'password' }, { visibility: 'members' }, { status: 'draft' },
      { seo: { noIndex: true } }, { seo: { robots: 'none' } }, { permissions: { roles: ['Admin'] } },
      { featureFlag: 'disabled-or-targeted' }, { publishDate: new Date(Date.now() + 60000) }, { expireDate: new Date(Date.now() - 60000) },
    ];
    await Page.collection.insertMany(variants.map((variant, index) => ({
      slug: `${fixturePrefix}page-${index}`, title: 'Discovery Page', status: 'published', visibility: 'public', seo: { metaDescription: 'Safe Page summary' }, ...variant,
    })));
    const result = await searchService.search('Discovery Page');
    expect(result.total).toBe(1);
    expect(result.results[0]).toMatchObject({ entityType: 'page', url: `/${fixturePrefix}page-0` });
    const privatePage = await Page.findOne({ slug: `${fixturePrefix}page-1` }).lean();
    await request(app).get(`/jsonld/page/${privatePage._id}`).expect(404);
    const sitemap = await SEOService.generateSitemap();
    expect(sitemap).toContain(`/${fixturePrefix}page-0</loc>`);
    variants.slice(1).forEach((_variant, index) => expect(sitemap).not.toContain(`/${fixturePrefix}page-${index + 1}</loc>`));
  });

  test('search treats regex metacharacters literally and bounds malformed input and pagination', async () => {
    await Article.collection.updateOne({ _id: ids.article }, { $set: { title: 'Discovery [literal] guide' } });
    expect((await searchService.search('[literal]')).total).toBe(1);
    expect((await searchService.search('.*')).total).toBe(0);
    expect(await searchService.autocomplete('[')).toEqual([]);
    expect(await searchService.autocomplete('Discovery [')).toHaveLength(1);
    await expect(searchService.search({ $ne: '' })).resolves.toMatchObject({ total: 0, results: [] });
    const result = await searchService.search('Discovery', { page: -50, limit: 100000 });
    expect(result).toMatchObject({ page: 1, limit: 48, total: 3 });
    expect((await searchService.search('a'.repeat(1000), { page: Infinity })).query).toHaveLength(100);
    expect((await searchService.search('Discovery', { entityType: 'user' })).total).toBe(0);
  });

  test('pagination counts only current matches and returns the requested page', async () => {
    const first = await searchService.search('Discovery', { page: 1, limit: 2 });
    const second = await searchService.search('Discovery', { page: 2, limit: 2 });
    expect(first.total).toBe(3);
    expect(second.total).toBe(3);
    expect(first.results).toHaveLength(2);
    expect(second.results).toHaveLength(1);
    expect(new Set([...first.results, ...second.results].map((item) => item.entityId)).size).toBe(3);
  });

  test('sitemap uses current routes, omits noindex and alternate canonicals, and filters private categories', async () => {
    await Category.collection.insertMany([
      { slug: `${fixturePrefix}category`, visibility: 'public', status: 'published', isActive: true, isDeleted: false, includeInSitemap: true },
      { slug: `${fixturePrefix}hidden-category`, visibility: 'private', status: 'published', isActive: true, isDeleted: false, includeInSitemap: true },
    ]);
    let xml = await SEOService.generateSitemap();
    expect(xml).toContain(`/articles/${fixturePrefix}article</loc>`);
    expect(xml).toContain(`/stories/${fixturePrefix}story</loc>`);
    expect(xml).toContain(`/stories/${fixturePrefix}legacy</loc>`);
    expect(xml).toContain(`/category/${fixturePrefix}category</loc>`);
    expect(xml).not.toContain('hidden-category');
    expect(xml).not.toContain('/article/');
    expect(xml).not.toContain('/p/');
    await Article.collection.updateOne({ _id: ids.article }, { $set: { 'seo.metaRobots': 'noindex,follow' } });
    await Article.collection.updateOne({ _id: ids.story }, { $set: { 'seo.canonicalUrl': 'https://another.example/original' } });
    xml = await SEOService.generateSitemap();
    expect(xml).not.toContain(`/articles/${fixturePrefix}article`);
    expect(xml).not.toContain(`/stories/${fixturePrefix}story`);
  });

  test('JSON-LD uses actual Article metadata/publication date and never includes protected text', async () => {
    await Article.collection.updateOne({ _id: ids.article }, { $set: {
      publishedAt: new Date('2026-01-02'), createdAt: new Date('2025-01-01'), updatedAt: new Date('2026-02-03'),
      coverImage: '/cover.webp', author: 'Original Author', seo: { description: 'Editorial description' },
    } });
    const response = await request(app).get(`/jsonld/article/${ids.article}`).expect(200);
    expect(response.body.data).toMatchObject({
      description: 'Editorial description', datePublished: '2026-01-02T00:00:00.000Z', dateModified: '2026-02-03T00:00:00.000Z',
      image: ['https://myjourney.example/cover.webp'], isAccessibleForFree: false,
      mainEntityOfPage: `https://myjourney.example/articles/${fixturePrefix}article`,
    });
    expect(response.text).not.toContain('PRIVATE_BODY_SENTINEL');
  });

  test('robots declares the real CMS and private application paths', async () => {
    const response = await request(app).get('/robots.txt').expect(200);
    ['cms', 'profile', 'creator-studio', 'life', 'agent', 'reset-password'].forEach((route) => expect(response.text).toContain(`Disallow: /${route}`));
    expect(response.text).toContain('Sitemap: https://myjourney.example/api/seo/sitemap.xml');
  });
});
