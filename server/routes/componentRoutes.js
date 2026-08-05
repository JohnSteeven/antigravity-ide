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
const apiRegistry = require('../core/apiRegistry');

// Public reads
router.get('/', componentController.getComponents);
router.get('/:id', componentController.getComponentById);

// Authenticated writes
router.post('/', authenticate, componentController.createComponent);
router.patch('/:id', authenticate, componentController.updateComponent);
router.delete('/:id', authenticate, componentController.deleteComponent);

apiRegistry.register({
  name: 'ComponentLibrary',
  prefix: '/api/components',
  router,
  public: true,
});

module.exports = router;
