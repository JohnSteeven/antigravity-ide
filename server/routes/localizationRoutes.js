/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  localizationRoutes.js  —  Localization API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 19: Localization & Translation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const localizationController = require('../controllers/localizationController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public SEO metadata is separated from CMS locale and translation management.
router.get('/hreflang/:entityType/:entityId', localizationController.getHreflang);
router.use(authenticate, requireAdmin);
router.get('/locales', localizationController.getLocales);
router.get('/progress', localizationController.getProgress);
router.get('/translations/:entityType/:entityId/:locale', localizationController.getTranslation);

// Writes
router.post('/locales', localizationController.addLocale);
router.post('/translations', localizationController.saveTranslation);

apiRegistry.register({
  name: 'LocalizationEngine',
  prefix: '/api/localization',
  router,
  public: true,
});

module.exports = router;
