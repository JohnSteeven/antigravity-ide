/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  featureFlagRoutes.js  —  Feature Flag API Routes
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const featureFlagController = require('../controllers/featureFlagController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public reads, authenticated writes
router.get('/', featureFlagController.getAllFeatures);
router.get('/:key', featureFlagController.getFeatureByKey);

router.post('/', authenticate, featureFlagController.createFeature);
router.patch('/:id', authenticate, featureFlagController.updateFeature);
router.delete('/:id', authenticate, featureFlagController.deleteFeature);
router.post('/:id/toggle', authenticate, featureFlagController.toggleFeature);
router.post('/:id/rollout', authenticate, featureFlagController.updateRollout);

// Self-register with server apiRegistry
apiRegistry.register({
  name: 'FeatureFlags',
  prefix: '/api/features',
  router,
  public: true,
});

module.exports = router;
