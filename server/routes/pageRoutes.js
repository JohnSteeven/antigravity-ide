/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pageRoutes.js  —  Page Engine API Routes
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public reads
router.get('/', pageController.getPages);
router.get('/slug/:slug', pageController.getPageBySlug);
router.get('/:id', pageController.getPageById);

// Authenticated writes
router.post('/', authenticate, pageController.createPage);
router.patch('/:id', authenticate, pageController.updatePage);
router.delete('/:id', authenticate, pageController.deletePage);

router.post('/:id/duplicate', authenticate, pageController.duplicatePage);
router.post('/:id/publish', authenticate, pageController.publishPage);

apiRegistry.register({
  name: 'PageEngine',
  prefix: '/api/pages',
  router,
  public: true,
});

module.exports = router;
