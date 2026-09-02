/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pluginRoutes.js  —  Plugin API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 15: Plugin Manager & Extension Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const pluginController = require('../controllers/pluginController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

router.use(authenticate, requireAdmin);

// Reads
router.get('/', pluginController.getPlugins);
router.get('/health', pluginController.runHealthCheck);
router.get('/:id', pluginController.getPluginById);

// Writes
router.post('/install', pluginController.installPlugin);
router.post('/:id/activate', pluginController.activatePlugin);
router.post('/:id/deactivate', pluginController.deactivatePlugin);

apiRegistry.register({
  name: 'PluginEngine',
  prefix: '/api/plugins',
  router,
  public: false,
});

module.exports = router;
