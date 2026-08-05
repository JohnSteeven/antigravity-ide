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
const apiRegistry = require('../core/apiRegistry');

// Reads
router.get('/jobs', authenticate, automationController.getJobs);
router.get('/jobs/:id', authenticate, automationController.getJobById);

// Writes & Execution
router.post('/jobs', authenticate, automationController.createJob);
router.post('/jobs/:id/retry', authenticate, automationController.retryJob);
router.post('/jobs/:id/cancel', authenticate, automationController.cancelJob);
router.post('/run-due', authenticate, automationController.runDueJobs);

apiRegistry.register({
  name: 'AutomationEngine',
  prefix: '/api/automation',
  router,
  public: true,
});

module.exports = router;
