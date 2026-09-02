/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  featureFlagRoutes.js  —  Feature Flag API Routes
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const featureFlagController = require('../controllers/featureFlagController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public callers receive evaluated status only; Admin callers receive the
// management document. The single-flag management endpoint is Admin-only.
router.get('/', optionalAuthenticate, featureFlagController.getAllFeatures);
router.get('/:key', authenticate, requireAdmin, featureFlagController.getFeatureByKey);

router.use(authenticate, requireAdmin);
router.post('/', featureFlagController.createFeature);
router.patch('/:id', featureFlagController.updateFeature);
router.delete('/:id', featureFlagController.deleteFeature);
router.post('/:id/toggle', featureFlagController.toggleFeature);
router.post('/:id/rollout', featureFlagController.updateRollout);

// Self-register with server apiRegistry
apiRegistry.register({
  name: 'FeatureFlags',
  prefix: '/api/features',
  router,
  public: true,
});

module.exports = router;
