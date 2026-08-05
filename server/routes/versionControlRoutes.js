/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  versionControlRoutes.js  —  Version Control API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 12: Version Control & Rollback Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const versionControlController = require('../controllers/versionControlController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Reads
router.get('/timeline/:entityType/:entityId', authenticate, versionControlController.getTimeline);
router.get('/compare', authenticate, versionControlController.compareVersions);
router.get('/version/:id', authenticate, versionControlController.getVersionById);

// Writes
router.post('/restore', authenticate, versionControlController.restoreVersion);
router.post('/tag/:id', authenticate, versionControlController.tagVersion);

apiRegistry.register({
  name: 'VersionControlEngine',
  prefix: '/api/version-control',
  router,
  public: true,
});

module.exports = router;
