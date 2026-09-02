/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  infrastructureRoutes.js  —  Cloud Infrastructure & Observability Routes
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const infrastructureController = require('../controllers/infrastructureController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Protected Prometheus metrics endpoint (requires admin auth)
router.get('/metrics/prometheus', authenticate, requireAdmin, infrastructureController.getPrometheusMetrics);

// Authenticated CMS infrastructure endpoints (require admin)
router.get('/metrics', authenticate, requireAdmin, infrastructureController.getMetrics);
router.get('/nodes', authenticate, requireAdmin, infrastructureController.getNodes);
router.get('/backups', authenticate, requireAdmin, infrastructureController.getBackups);
router.post('/backups', authenticate, requireAdmin, infrastructureController.triggerBackup);
router.get('/workers', authenticate, requireAdmin, infrastructureController.getWorkers);

apiRegistry.register({
  name: 'InfrastructurePlatform',
  prefix: '/api/infrastructure',
  router,
  public: false,
  version: '6.0.0',
});

module.exports = router;
