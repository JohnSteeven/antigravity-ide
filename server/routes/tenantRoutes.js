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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public tenant lookup
router.get('/public/:id', tenantController.getTenantById);

// Admin CMS endpoints
router.get('/', authenticate, requireAdmin, tenantController.getTenants);
router.post('/', authenticate, requireAdmin, tenantController.createTenant);
router.patch('/:id/branding', authenticate, requireAdmin, tenantController.updateBranding);

apiRegistry.register({
  name: 'TenantPlatform',
  prefix: '/api/tenants',
  router,
  public: true,
  version: '5.0.0',
});

module.exports = router;
