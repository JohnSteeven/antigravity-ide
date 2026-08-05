/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  navigationRoutes.js  —  Navigation Engine API Routes
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public reads
router.get('/', navigationController.getNavTree);
router.get('/zones', navigationController.getZones);
router.get('/breadcrumb', navigationController.getBreadcrumb);
router.get('/analytics', navigationController.getAnalytics);
router.post('/click/:id', navigationController.recordClick);
router.get('/:id', navigationController.getItemById);

// Authenticated writes
router.post('/', authenticate, navigationController.createItem);
router.patch('/:id', authenticate, navigationController.updateItem);
router.delete('/:id', authenticate, navigationController.deleteItem);
router.post('/validate', authenticate, navigationController.validateLinks);
router.post('/zones', authenticate, navigationController.createZone);

apiRegistry.register({
  name: 'NavigationEngine',
  prefix: '/api/navigation',
  router,
  public: true,
});

module.exports = router;
