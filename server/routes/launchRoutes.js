/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  launchRoutes.js  —  Launch Readiness & Release Routes
 *  MyJourney Platform  |  Stage 6 — Phase 30: Launch Readiness Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const launchController = require('../controllers/launchController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public launch release endpoint
router.get('/releases', launchController.getReleases);

// Authenticated CMS Launch Console endpoints
router.get('/audit', authenticate, requireAdmin, launchController.getAuditReport);
router.get('/deployments', authenticate, requireAdmin, launchController.getDeployments);
router.get('/tests', authenticate, requireAdmin, launchController.getTests);

apiRegistry.register({
  name: 'LaunchPlatform',
  prefix: '/api/launch',
  router,
  public: true,
  version: '6.0.0',
});

module.exports = router;
