/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  workflowRoutes.js  —  Workflow API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 11: Enterprise Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Editorial workflow state and comments are CMS/Admin data.
router.use(authenticate, requireAdmin);

// Reads
router.get('/definitions', workflowController.getDefinitions);
router.get('/my-tasks', workflowController.getMyTasks);
router.get('/calendar', workflowController.getCalendar);
router.get('/analytics', workflowController.getAnalytics);
router.get('/history/:contentType/:contentId', workflowController.getHistory);
router.get('/comments/:contentType/:contentId', workflowController.getComments);

// Writes
router.post('/transition', workflowController.transitionState);
router.post('/comments', workflowController.addComment);

apiRegistry.register({
  name: 'WorkflowEngine',
  prefix: '/api/workflows',
  router,
  public: false,
});

module.exports = router;
