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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Content schemas and entries are an Admin/CMS surface. Published public
// content is served by its owning domain, not by this modeling API.
router.use(authenticate, requireAdmin);

// Content Type Schemas
router.get('/types', contentModelingController.getContentTypes);
router.get('/types/:id', contentModelingController.getContentTypeById);
router.post('/types', contentModelingController.createContentType);
router.patch('/types/:id', contentModelingController.updateContentType);
router.delete('/types/:id', contentModelingController.deleteContentType);

// Dynamic Headless Content Entries
router.get('/entries/:typeKey', contentModelingController.getEntries);
router.post('/entries/:typeKey', contentModelingController.createEntry);
router.delete('/entries/:id', contentModelingController.deleteEntry);

apiRegistry.register({
  name: 'HeadlessContentEngine',
  prefix: '/api/content-modeling',
  router,
  public: false,
});

module.exports = router;
