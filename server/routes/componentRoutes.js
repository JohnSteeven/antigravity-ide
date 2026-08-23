/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  componentRoutes.js  —  Component Manifest API Routes
 *  MyJourney CMS  |  Phase 8: Component Library & Block Marketplace
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Component manifests are CMS builder metadata, not a public content API.
router.use(authenticate, requireAdmin);
router.get('/', componentController.getComponents);
router.get('/:id', componentController.getComponentById);

router.post('/', componentController.createComponent);
router.patch('/:id', componentController.updateComponent);
router.delete('/:id', componentController.deleteComponent);

apiRegistry.register({
  name: 'ComponentLibrary',
  prefix: '/api/components',
  router,
  public: false,
});

module.exports = router;
