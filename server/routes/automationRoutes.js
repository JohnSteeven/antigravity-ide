/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  automationRoutes.js  —  Automation API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 13: Content Scheduler & Automation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

router.use(authenticate, requireAdmin);

// Reads
router.get('/jobs', automationController.getJobs);
router.get('/jobs/:id', automationController.getJobById);

// Writes & Execution
router.post('/jobs', automationController.createJob);
router.post('/jobs/:id/retry', automationController.retryJob);
router.post('/jobs/:id/cancel', automationController.cancelJob);
router.post('/run-due', automationController.runDueJobs);

apiRegistry.register({
  name: 'AutomationEngine',
  prefix: '/api/automation',
  router,
  public: false,
});

module.exports = router;
