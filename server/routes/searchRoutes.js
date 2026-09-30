/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  searchRoutes.js  —  Enterprise Search & Knowledge Graph Routes
 *  MyJourney Platform  |  Phase 28: Global Search / Discovery / Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public & Personalized search endpoints
router.get('/', searchController.universalSearch);
router.get('/autocomplete', searchController.autocomplete);
router.get('/discovery/home', optionalAuthenticate, searchController.getHomeDiscovery || ((req, res) => res.json({ continueLearning: [], recommendations: [] })));
router.get('/graph/neighbors', searchController.getGraphNeighbors);

// Admin CMS endpoints
router.get('/graph/stats', authenticate, requireAdmin, searchController.getGraphStats);
router.post('/reindex', authenticate, requireAdmin, searchController.reindexAll);

apiRegistry.register({
  name: 'SearchPlatform',
  prefix: '/api/search',
  router,
  public: true,
  version: '5.0.0',
});

module.exports = router;
