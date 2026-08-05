/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  layoutRoutes.js  —  Layout Engine API Routes
 *  MyJourney CMS  |  Phase 3: Layout Manager
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const layoutController = require('../controllers/layoutController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public reads, authenticated writes
router.get('/', layoutController.getLayouts);
router.get('/templates', (req, res, next) => { req.query.isTemplate = 'true'; next(); }, layoutController.getLayouts);
router.get('/:id', layoutController.getLayoutById);

router.post('/', authenticate, layoutController.createLayout);
router.patch('/:id', authenticate, layoutController.updateLayout);
router.delete('/:id', authenticate, layoutController.deleteLayout);

router.post('/:id/duplicate', authenticate, layoutController.duplicateLayout);
router.post('/:id/publish', authenticate, layoutController.publishLayout);
router.post('/:id/archive', authenticate, layoutController.archiveLayout);

apiRegistry.register({
  name: 'LayoutEngine',
  prefix: '/api/layouts',
  router,
  public: true,
});

module.exports = router;
