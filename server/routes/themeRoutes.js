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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// The active published theme is the only public theme contract.
router.get('/active', themeController.getActiveTheme);

// CMS/Admin reads and writes
router.use(authenticate, requireAdmin);
router.get('/', themeController.getThemes);
router.get('/:id', themeController.getThemeById);
router.post('/', themeController.createTheme);
router.patch('/:id', themeController.updateTheme);
router.delete('/:id', themeController.deleteTheme);
router.post('/:id/publish', themeController.publishTheme);

apiRegistry.register({
  name: 'ThemeEngine',
  prefix: '/api/themes',
  router,
  public: true,
});

module.exports = router;
