/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  analyticsRoutes.js  —  Analytics API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 18: Content Intelligence & Reader Analytics
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public Event Tracking
router.post('/track', analyticsController.trackEvent);

// Authenticated CMS Read
router.get('/overview', authenticate, requireAdmin, analyticsController.getOverview);

apiRegistry.register({
  name: 'AnalyticsEngine',
  prefix: '/api/analytics',
  router,
  public: true,
});

module.exports = router;
