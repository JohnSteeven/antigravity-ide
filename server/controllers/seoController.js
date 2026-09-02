/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  seoController.js  —  SEO Intelligence API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 17: SEO Intelligence & Structured Data
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SEOService = require('../services/seoService');
const Article = require('../models/Article');
const Page = require('../models/Page');

const present = (value) => typeof value === 'string' && value.trim().length > 0;

exports.getDashboard = async (_req, res, next) => {
  try {
    const [articles, pages] = await Promise.all([
      Article.find({ status: 'published', isDeleted: { $ne: true } })
        .select('title slug description body coverImage coverImageAlt seo')
        .lean(),
      Page.find({ status: 'published', visibility: 'public' })
        .select('title slug featuredImage seo')
        .lean(),
    ]);

    const records = [
      ...articles.map((article) => ({
        title: article.title,
        slug: article.slug,
        content: article.body,
        metaTitle: article.seo?.title,
        metaDescription: article.seo?.description || article.description,
        image: article.seo?.openGraphImage || article.coverImage,
        imageNeedsAlt: present(article.coverImage) && !present(article.coverImageAlt),
        hasSchema: true,
      })),
      ...pages.map((page) => ({
        title: page.title,
        slug: page.slug,
        content: '',
        metaTitle: page.seo?.metaTitle,
        metaDescription: page.seo?.metaDescription,
        image: page.seo?.ogImage || page.featuredImage,
        imageNeedsAlt: false,
        hasSchema: present(page.seo?.schemaType),
      })),
    ];

    const scores = records.map((record) => SEOService.analyzeSEO(record).seoScore);
    const normalizedTitles = records
      .map((record) => (record.metaTitle || record.title || '').trim().toLowerCase())
      .filter(Boolean);
    const duplicateTitles = normalizedTitles.length - new Set(normalizedTitles).size;
    const total = records.length;

    return res.json({
      success: true,
      data: {
        seoScore: total ? Math.round(scores.reduce((sum, score) => sum + score, 0) / total) : null,
        indexedPages: total,
        missingMetaTitles: records.filter((record) => !present(record.metaTitle)).length,
        missingMetaDescriptions: records.filter((record) => !present(record.metaDescription)).length,
        missingAltText: records.filter((record) => record.imageNeedsAlt).length,
        duplicateTitles,
        schemaCoverage: total
          ? Math.round((records.filter((record) => record.hasSchema).length / total) * 100)
          : null,
        evidenceSource: 'published_content_records',
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.analyzeContent = async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription, image, slug } = req.body;
    const analysis = SEOService.analyzeSEO({ title, content, metaTitle, metaDescription, image, slug });
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', message: err.message });
  }
};

exports.getSitemap = async (req, res) => {
  try {
    const xml = await SEOService.generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Sitemap generation error');
  }
};

exports.getRobotsTxt = async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://myjourney.com';
    const txt = `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nAllow: /\n\nSitemap: ${baseUrl}/api/seo/sitemap.xml\n`;
    res.header('Content-Type', 'text/plain');
    res.send(txt);
  } catch (err) {
    res.status(500).send('Robots.txt error');
  }
};

exports.getJsonLd = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    if (!['article', 'page'].includes(entityType)) {
      return res.status(400).json({ error: 'Unsupported SEO entity type.' });
    }

    const doc = entityType === 'article'
      ? await Article.findOne({ _id: entityId, status: 'published', isDeleted: { $ne: true } }).lean()
      : await Page.findOne({ _id: entityId, status: 'published', visibility: 'public' }).lean();

    if (!doc) return res.status(404).json({ error: 'Published content not found.' });

    const jsonLd = SEOService.generateJsonLd(entityType === 'article' ? 'Article' : 'WebPage', doc);
    return res.json({ success: true, data: jsonLd });
  } catch (err) {
    return next(err);
  }
};
