/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  searchRoutes.js  —  Enterprise Search & Knowledge Graph Routes
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public search endpoints
router.get('/', searchController.universalSearch);
router.get('/autocomplete', searchController.autocomplete);
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
