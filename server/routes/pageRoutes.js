/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pageRoutes.js  —  Page Engine API Routes
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Published page resolution is the only public page-engine contract.
router.get('/slug/:slug', optionalAuthenticate, pageController.getPageBySlug);

// CMS/Admin reads and writes
router.use(authenticate, requireAdmin);
router.get('/', pageController.getPages);
router.get('/:id', pageController.getPageById);
router.post('/', pageController.createPage);
router.patch('/:id', pageController.updatePage);
router.delete('/:id', pageController.deletePage);

router.post('/:id/duplicate', pageController.duplicatePage);
router.post('/:id/publish', pageController.publishPage);

apiRegistry.register({
  name: 'PageEngine',
  prefix: '/api/pages',
  router,
  public: true,
});

module.exports = router;
