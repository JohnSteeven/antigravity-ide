/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  governanceController.js  —  Governance & Security API Controller
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Organization      = require('../models/Organization');
const IdentityProvider  = require('../models/IdentityProvider');
const SecurityPolicy    = require('../models/SecurityPolicy');
const ComplianceRecord  = require('../models/ComplianceRecord');
const SecretVault       = require('../models/SecretVault');
const GovernanceService = require('../services/governanceService');

// ── Organizations ─────────────────────────────────────────────────────────────

exports.getOrgs = async (req, res) => {
  try {
    const orgs = await Organization.find().populate('owner', 'firstName lastName email').lean();
    res.json({ success: true, data: orgs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrg = async (req, res) => {
  try {
    const org = await Organization.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, data: org });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── SSO Identity Providers ───────────────────────────────────────────────────

exports.getIdps = async (req, res) => {
  try {
    const idps = await IdentityProvider.find().lean();
    res.json({ success: true, data: idps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createIdp = async (req, res) => {
  try {
    const idp = await IdentityProvider.create(req.body);
    res.status(201).json({ success: true, data: idp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Security Policies ─────────────────────────────────────────────────────────

exports.getPolicies = async (req, res) => {
  try {
    const policies = await SecurityPolicy.find().lean();
    res.json({ success: true, data: policies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const policy = await SecurityPolicy.create(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Compliance & Secret Vault ────────────────────────────────────────────────

exports.exportUserData = async (req, res) => {
  return res.status(503).json({
    error: 'Service Unavailable',
    message: 'GDPR export service is disabled in private beta.',
  });
};

exports.getSecrets = async (req, res) => {
  if (!GovernanceService.isVaultEnabled()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Secret Vault is disabled in private beta.',
    });
  }
  try {
    const secrets = await SecretVault.find().select('secretKey version lastRotatedAt encryptionVersion').lean();
    res.json({ success: true, data: secrets });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
};

exports.setSecret = async (req, res) => {
  if (!GovernanceService.isVaultEnabled()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Secret Vault is disabled in private beta.',
    });
  }
  try {
    const { secretKey, value } = req.body;
    const secret = await GovernanceService.setSecret(secretKey, value);
    res.status(201).json({ success: true, data: secret });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
};
