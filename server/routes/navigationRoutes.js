/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  navigationRoutes.js  —  Navigation Engine API Routes
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public reads
router.get('/', optionalAuthenticate, navigationController.getNavTree);
router.get('/breadcrumb', navigationController.getBreadcrumb);
router.post('/click/:id', navigationController.recordClick);

// CMS/Admin reads and writes
router.use(authenticate, requireAdmin);
router.get('/zones', navigationController.getZones);
router.get('/analytics', navigationController.getAnalytics);
router.get('/:id', navigationController.getItemById);
router.post('/', navigationController.createItem);
router.patch('/:id', navigationController.updateItem);
router.delete('/:id', navigationController.deleteItem);
router.post('/validate', navigationController.validateLinks);
router.post('/zones', navigationController.createZone);

apiRegistry.register({
  name: 'NavigationEngine',
  prefix: '/api/navigation',
  router,
  public: true,
});

module.exports = router;
