/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  tenantController.js  —  Multi-Tenant & White-Label Controller
 *  MyJourney Platform  |  Stage 5 — Phase 27: Enterprise Multi-Site Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Tenant = require('../models/Tenant');
const TenantService = require('../services/tenantService');

exports.getTenants = async (req, res) => {
  try {
    const tenants = await TenantService.getAllTenants();
    res.json({ success: true, data: tenants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTenant = async (req, res) => {
  try {
    const tenant = await TenantService.createTenant(req.body);
    res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBranding = async (req, res) => {
  try {
    const tenant = await TenantService.updateBranding(req.params.id, req.body);
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).lean();
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
