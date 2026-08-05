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
const apiRegistry = require('../core/apiRegistry');

// Reads
router.get('/locales', localizationController.getLocales);
router.get('/hreflang/:entityType/:entityId', localizationController.getHreflang);
router.get('/progress', authenticate, localizationController.getProgress);
router.get('/translations/:entityType/:entityId/:locale', authenticate, localizationController.getTranslation);

// Writes
router.post('/locales', authenticate, localizationController.addLocale);
router.post('/translations', authenticate, localizationController.saveTranslation);

apiRegistry.register({
  name: 'LocalizationEngine',
  prefix: '/api/localization',
  router,
  public: true,
});

module.exports = router;
