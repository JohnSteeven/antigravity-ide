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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

router.use(authenticate, requireAdmin);

// Reads
router.get('/layout', dashboardController.getLayout);
router.get('/widgets', dashboardController.getWidgets);

// Writes
router.post('/layout', dashboardController.saveLayout);
router.post('/reset', dashboardController.resetLayout);

apiRegistry.register({
  name: 'DashboardEngine',
  prefix: '/api/dashboard',
  router,
  public: false,
});

module.exports = router;
