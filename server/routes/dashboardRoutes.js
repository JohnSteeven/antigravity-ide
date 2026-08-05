/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  dashboardRoutes.js  —  Dashboard API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 16: Dashboard & Widget Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Reads
router.get('/layout', authenticate, dashboardController.getLayout);
router.get('/widgets', authenticate, dashboardController.getWidgets);

// Writes
router.post('/layout', authenticate, dashboardController.saveLayout);
router.post('/reset', authenticate, dashboardController.resetLayout);

apiRegistry.register({
  name: 'DashboardEngine',
  prefix: '/api/dashboard',
  router,
  public: true,
});

module.exports = router;
