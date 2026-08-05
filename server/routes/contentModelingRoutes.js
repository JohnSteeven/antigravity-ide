/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  contentModelingRoutes.js  —  Headless Content Modeling API Routes
 *  MyJourney CMS  |  Phase 9: Enterprise Content Modeling Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const contentModelingController = require('../controllers/contentModelingController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Content Type Schemas
router.get('/types', contentModelingController.getContentTypes);
router.get('/types/:id', contentModelingController.getContentTypeById);
router.post('/types', authenticate, contentModelingController.createContentType);
router.patch('/types/:id', authenticate, contentModelingController.updateContentType);
router.delete('/types/:id', authenticate, contentModelingController.deleteContentType);

// Dynamic Headless Content Entries
router.get('/entries/:typeKey', contentModelingController.getEntries);
router.post('/entries/:typeKey', authenticate, contentModelingController.createEntry);
router.delete('/entries/:id', authenticate, contentModelingController.deleteEntry);

apiRegistry.register({
  name: 'HeadlessContentEngine',
  prefix: '/api/content-modeling',
  router,
  public: true,
});

module.exports = router;
