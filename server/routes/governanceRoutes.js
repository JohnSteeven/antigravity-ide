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
const apiRegistry = require('../core/apiRegistry');

// All governance endpoints require authentication
router.get('/orgs', authenticate, governanceController.getOrgs);
router.post('/orgs', authenticate, governanceController.createOrg);

router.get('/idps', authenticate, governanceController.getIdps);
router.post('/idps', authenticate, governanceController.createIdp);

router.get('/policies', authenticate, governanceController.getPolicies);
router.post('/policies', authenticate, governanceController.createPolicy);

router.post('/compliance/export', authenticate, governanceController.exportUserData);

router.get('/secrets', authenticate, governanceController.getSecrets);
router.post('/secrets', authenticate, governanceController.setSecret);

apiRegistry.register({
  name: 'GovernancePlatform',
  prefix: '/api/governance',
  router,
  public: true,
  version: '6.0.0',
});

module.exports = router;
