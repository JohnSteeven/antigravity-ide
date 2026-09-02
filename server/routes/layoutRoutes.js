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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Layout documents contain drafts and builder configuration. Public pages
// receive only their published layout through the page serializer.
router.use(authenticate, requireAdmin);
router.get('/', layoutController.getLayouts);
router.get('/templates', (req, res, next) => { req.query.isTemplate = 'true'; next(); }, layoutController.getLayouts);
router.get('/:id', layoutController.getLayoutById);

router.post('/', layoutController.createLayout);
router.patch('/:id', layoutController.updateLayout);
router.delete('/:id', layoutController.deleteLayout);

router.post('/:id/duplicate', layoutController.duplicateLayout);
router.post('/:id/publish', layoutController.publishLayout);
router.post('/:id/archive', layoutController.archiveLayout);

apiRegistry.register({
  name: 'LayoutEngine',
  prefix: '/api/layouts',
  router,
  public: false,
});

module.exports = router;
