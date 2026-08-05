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
const apiRegistry = require('../core/apiRegistry');

// Reads
router.get('/definitions', workflowController.getDefinitions);
router.get('/my-tasks', authenticate, workflowController.getMyTasks);
router.get('/calendar', authenticate, workflowController.getCalendar);
router.get('/analytics', authenticate, workflowController.getAnalytics);
router.get('/history/:contentType/:contentId', authenticate, workflowController.getHistory);
router.get('/comments/:contentType/:contentId', authenticate, workflowController.getComments);

// Writes
router.post('/transition', authenticate, workflowController.transitionState);
router.post('/comments', authenticate, workflowController.addComment);

apiRegistry.register({
  name: 'WorkflowEngine',
  prefix: '/api/workflows',
  router,
  public: true,
});

module.exports = router;
