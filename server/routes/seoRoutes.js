/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  seoRoutes.js  —  SEO Intelligence API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 17: SEO Intelligence & Structured Data
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public XML Sitemap & Robots.txt
router.get('/sitemap.xml', seoController.getSitemap);
router.get('/robots.txt', seoController.getRobotsTxt);
router.get('/json-ld/:entityType/:entityId', seoController.getJsonLd);

// Authenticated CMS Management & Analyzer
router.get('/dashboard', authenticate, seoController.getDashboard);
router.post('/analyze', authenticate, seoController.analyzeContent);

apiRegistry.register({
  name: 'SEOEngine',
  prefix: '/api/seo',
  router,
  public: true,
});

module.exports = router;
