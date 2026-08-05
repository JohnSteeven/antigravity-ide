/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  communityRoutes.js  —  Community & Discussion API Routes
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public endpoints
router.get('/feed', communityController.getFeed);

// Reader authenticated endpoints
router.post('/follow', authenticate, communityController.toggleFollow);
router.get('/follows', authenticate, communityController.getFollows);
router.get('/reputation', authenticate, communityController.getReputation);
router.post('/polls/:id/vote', authenticate, communityController.votePoll);
router.post('/report', communityController.reportComment);

// Admin CMS endpoints
router.get('/moderation', authenticate, requireAdmin, communityController.getModerationQueue);
router.patch('/moderation/:id', authenticate, requireAdmin, communityController.updateModerationReport);

apiRegistry.register({
  name: 'CommunityPlatform',
  prefix: '/api/community',
  router,
  public: true,
  version: '4.0.0',
});

module.exports = router;
