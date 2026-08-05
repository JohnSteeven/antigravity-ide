/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  developerController.js  —  Developer Portal API Controller
 *  MyJourney Platform  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ApiKey              = require('../models/ApiKey');
const ApiApplication     = require('../models/ApiApplication');
const WebhookSubscription = require('../models/WebhookSubscription');
const ApiGatewayService   = require('../services/apiGatewayService');
const crypto              = require('crypto');

// ── API Keys ─────────────────────────────────────────────────────────────────

exports.getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ owner: req.user.id }).lean();
    res.json({ success: true, data: keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createApiKey = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const apiKey = await ApiGatewayService.createApiKey(req.user.id, name || 'Default Key', permissions || ['read']);
    res.status(201).json({ success: true, data: apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.revokeApiKey = async (req, res) => {
  try {
    const key = await ApiKey.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { status: 'revoked' }, { new: true });
    res.json({ success: true, data: key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Webhooks ──────────────────────────────────────────────────────────────────

exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await WebhookSubscription.find({ owner: req.user.id }).lean();
    res.json({ success: true, data: webhooks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createWebhook = async (req, res) => {
  try {
    const { targetUrl, events } = req.body;
    const secret = `whsec_${crypto.randomBytes(20).toString('hex')}`;
    const webhook = await WebhookSubscription.create({
      targetUrl,
      events: events || ['article.published'],
      secret,
      owner: req.user.id,
    });
    res.status(201).json({ success: true, data: webhook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── OAuth Applications ────────────────────────────────────────────────────────

exports.getApplications = async (req, res) => {
  try {
    const apps = await ApiApplication.find({ owner: req.user.id }).lean();
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createApplication = async (req, res) => {
  try {
    const { name, redirectUris } = req.body;
    const app = await ApiGatewayService.createApplication(req.user.id, name, redirectUris || []);
    res.status(201).json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
