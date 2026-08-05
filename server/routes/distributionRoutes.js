/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  distributionRoutes.js  —  Omnichannel Distribution API Routes
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public podcast RSS XML feed
router.get('/podcasts/rss', distributionController.getPodcastRss);
router.get('/podcasts', distributionController.getPodcasts);

// Authenticated CMS Distribution Endpoints
router.get('/campaigns', authenticate, requireAdmin, distributionController.getCampaigns);
router.post('/campaigns', authenticate, requireAdmin, distributionController.launchCampaign);
router.post('/social/captions', authenticate, distributionController.generateSocialCaptions);
router.get('/social/accounts', authenticate, requireAdmin, distributionController.getSocialAccounts);
router.post('/social/accounts', authenticate, requireAdmin, distributionController.connectSocialAccount);
router.post('/podcasts', authenticate, requireAdmin, distributionController.createPodcast);

apiRegistry.register({
  name: 'DistributionPlatform',
  prefix: '/api/distribution',
  router,
  public: true,
  version: '4.0.0',
});

module.exports = router;
