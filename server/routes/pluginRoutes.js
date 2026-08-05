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
const apiRegistry = require('../core/apiRegistry');

// Reads
router.get('/', authenticate, pluginController.getPlugins);
router.get('/health', authenticate, pluginController.runHealthCheck);
router.get('/:id', authenticate, pluginController.getPluginById);

// Writes
router.post('/install', authenticate, pluginController.installPlugin);
router.post('/:id/activate', authenticate, pluginController.activatePlugin);
router.post('/:id/deactivate', authenticate, pluginController.deactivatePlugin);

apiRegistry.register({
  name: 'PluginEngine',
  prefix: '/api/plugins',
  router,
  public: true,
});

module.exports = router;
