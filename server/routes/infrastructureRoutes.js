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
const apiRegistry = require('../core/apiRegistry');

// Public Prometheus metrics endpoint
router.get('/metrics/prometheus', infrastructureController.getPrometheusMetrics);

// Authenticated CMS infrastructure endpoints
router.get('/metrics', authenticate, infrastructureController.getMetrics);
router.get('/nodes', authenticate, infrastructureController.getNodes);
router.get('/backups', authenticate, infrastructureController.getBackups);
router.post('/backups', authenticate, infrastructureController.triggerBackup);
router.get('/workers', authenticate, infrastructureController.getWorkers);

apiRegistry.register({
  name: 'InfrastructurePlatform',
  prefix: '/api/infrastructure',
  router,
  public: true,
  version: '6.0.0',
});

module.exports = router;
