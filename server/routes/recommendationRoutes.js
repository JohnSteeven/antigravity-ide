/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  recommendationRoutes.js  —  Recommendation API Routes
 *  MyJourney CMS  |  Stage 3 — Phase 20: Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const apiRegistry = require('../core/apiRegistry');

router.get('/', recommendationController.getRecommendations);

apiRegistry.register({
  name: 'RecommendationEngine',
  prefix: '/api/recommendations',
  router,
  public: true,
});

module.exports = router;
