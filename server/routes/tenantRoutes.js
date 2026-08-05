/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  tenantRoutes.js  —  Multi-Tenant & White-Label Routes
 *  MyJourney Platform  |  Stage 5 — Phase 27: Enterprise Multi-Site Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public tenant lookup
router.get('/public/:id', tenantController.getTenantById);

// Admin CMS endpoints
router.get('/', authenticate, tenantController.getTenants);
router.post('/', authenticate, tenantController.createTenant);
router.patch('/:id/branding', authenticate, tenantController.updateBranding);

apiRegistry.register({
  name: 'TenantPlatform',
  prefix: '/api/tenants',
  router,
  public: true,
  version: '5.0.0',
});

module.exports = router;
