/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  governanceRoutes.js  —  Governance, Compliance & SSO Routes
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const governanceController = require('../controllers/governanceController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// All governance endpoints require authentication and administrator privilege
router.get('/orgs', authenticate, requireAdmin, governanceController.getOrgs);
router.post('/orgs', authenticate, requireAdmin, governanceController.createOrg);

router.get('/idps', authenticate, requireAdmin, governanceController.getIdps);
router.post('/idps', authenticate, requireAdmin, governanceController.createIdp);

router.get('/policies', authenticate, requireAdmin, governanceController.getPolicies);
router.post('/policies', authenticate, requireAdmin, governanceController.createPolicy);

router.post('/compliance/export', authenticate, requireAdmin, governanceController.exportUserData);

router.get('/secrets', authenticate, requireAdmin, governanceController.getSecrets);
router.post('/secrets', authenticate, requireAdmin, governanceController.setSecret);

apiRegistry.register({
  name: 'GovernancePlatform',
  prefix: '/api/governance',
  router,
  public: true,
  version: '6.0.0',
});

module.exports = router;
