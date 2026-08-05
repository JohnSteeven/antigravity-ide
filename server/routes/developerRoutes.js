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
const apiRegistry = require('../core/apiRegistry');

// All developer portal routes require authentication
router.get('/keys', authenticate, developerController.getApiKeys);
router.post('/keys', authenticate, developerController.createApiKey);
router.delete('/keys/:id', authenticate, developerController.revokeApiKey);

router.get('/webhooks', authenticate, developerController.getWebhooks);
router.post('/webhooks', authenticate, developerController.createWebhook);

router.get('/apps', authenticate, developerController.getApplications);
router.post('/apps', authenticate, developerController.createApplication);

apiRegistry.register({
  name: 'DeveloperPlatform',
  prefix: '/api/developer',
  router,
  public: true,
  version: '5.0.0',
});

module.exports = router;
