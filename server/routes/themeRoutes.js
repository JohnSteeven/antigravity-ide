/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  themeRoutes.js  —  Design System Theme API Routes
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public reads
router.get('/', themeController.getThemes);
router.get('/active', themeController.getActiveTheme);
router.get('/:id', themeController.getThemeById);

// Authenticated writes
router.post('/', authenticate, themeController.createTheme);
router.patch('/:id', authenticate, themeController.updateTheme);
router.delete('/:id', authenticate, themeController.deleteTheme);
router.post('/:id/publish', authenticate, themeController.publishTheme);

apiRegistry.register({
  name: 'ThemeEngine',
  prefix: '/api/themes',
  router,
  public: true,
});

module.exports = router;
