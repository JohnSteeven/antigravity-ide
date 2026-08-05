/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  developerRoutes.js  —  Developer Platform & API Gateway Routes
 *  MyJourney Platform  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const developerController = require('../controllers/developerController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// All developer portal routes require authentication and administrator privilege
router.get('/keys', authenticate, requireAdmin, developerController.getApiKeys);
router.post('/keys', authenticate, requireAdmin, developerController.createApiKey);
router.delete('/keys/:id', authenticate, requireAdmin, developerController.revokeApiKey);

router.get('/webhooks', authenticate, requireAdmin, developerController.getWebhooks);
router.post('/webhooks', authenticate, requireAdmin, developerController.createWebhook);

router.get('/apps', authenticate, requireAdmin, developerController.getApplications);
router.post('/apps', authenticate, requireAdmin, developerController.createApplication);

apiRegistry.register({
  name: 'DeveloperPlatform',
  prefix: '/api/developer',
  router,
  public: true,
  version: '5.0.0',
});

module.exports = router;
