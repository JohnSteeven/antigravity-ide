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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

router.use(authenticate, requireAdmin);

// Reads
router.get('/timeline/:entityType/:entityId', versionControlController.getTimeline);
router.get('/compare', versionControlController.compareVersions);
router.get('/version/:id', versionControlController.getVersionById);

// Writes
router.post('/restore', versionControlController.restoreVersion);
router.post('/tag/:id', versionControlController.tagVersion);

apiRegistry.register({
  name: 'VersionControlEngine',
  prefix: '/api/version-control',
  router,
  public: false,
});

module.exports = router;
