/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  designTokenController.js  —  Design Token API Controller
 *  MyJourney CMS  |  Phase 7: Design Token Management System
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DesignToken = require('../models/DesignToken');
const DesignTokenService = require('../services/designTokenService');
const AuditLogger = require('../audit/AuditLogger');

exports.getTokens = async (req, res) => {
  try {
    await DesignTokenService.seedDefaults(req.user?.id);
    const { group, category, search } = req.query;
    const query = {};
    if (group && group !== 'All') query.group = group;
    if (category && category !== 'All') query.category = category;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ key: regex }, { name: regex }, { description: regex }];
    }

    const tokens = await DesignToken.find(query).sort({ category: 1, key: 1 }).lean();
    res.json({ success: true, data: tokens });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch design tokens', message: err.message });
  }
};

exports.getGeneratedCSS = async (req, res) => {
  try {
    const css = await DesignTokenService.generateCSS();
    res.type('text/css').send(css);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate CSS tokens', message: err.message });
  }
};

exports.getTokenById = async (req, res) => {
  try {
    const token = await DesignToken.findById(req.params.id);
    if (!token) return res.status(404).json({ error: 'Not Found', message: 'Token not found' });
    res.json({ success: true, data: token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token', message: err.message });
  }
};

exports.createToken = async (req, res) => {
  try {
    const { key, name, value, type, category, group, description } = req.body;
    const cleanKey = key.toLowerCase().trim();

    const existing = await DesignToken.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Token key '${cleanKey}' already exists.` });
    }

    const token = new DesignToken({
      key: cleanKey,
      name,
      value,
      type: type || 'color',
      category: category || 'Colors',
      group: group || 'Core',
      description: description || '',
      createdBy: req.user?.id,
    });

    await token.save();
    res.status(201).json({ success: true, data: token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create token', message: err.message });
  }
};

exports.updateToken = async (req, res) => {
  try {
    const token = await DesignToken.findById(req.params.id);
    if (!token) return res.status(404).json({ error: 'Not Found', message: 'Token not found' });

    const oldDoc = token.toObject();
    const { name, value, category, group, description, usedIn } = req.body;

    if (name !== undefined) token.name = name;
    if (value !== undefined) token.value = value;
    if (category !== undefined) token.category = category;
    if (group !== undefined) token.group = group;
    if (description !== undefined) token.description = description;
    if (usedIn !== undefined) token.usedIn = usedIn;

    token.version = (token.version || 1) + 1;
    token.updatedBy = req.user?.id;

    await token.save();

    await AuditLogger.log({
      entity: 'design_token',
      entityId: token._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: token,
      req,
      details: `Updated design token '${token.key}' to value '${token.value}'`,
    });

    res.json({ success: true, data: token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update token', message: err.message });
  }
};

exports.deleteToken = async (req, res) => {
  try {
    const token = await DesignToken.findById(req.params.id);
    if (!token) return res.status(404).json({ error: 'Not Found', message: 'Token not found' });
    if (token.isCore) {
      return res.status(400).json({ error: 'Core Token Protected', message: 'Core tokens cannot be deleted.' });
    }

    await DesignToken.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Token '${token.key}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete token', message: err.message });
  }
};

exports.exportTokens = async (req, res) => {
  try {
    const tokens = await DesignToken.find().lean();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="design-tokens.json"');
    res.json({ success: true, exportedAt: new Date(), count: tokens.length, tokens });
  } catch (err) {
    res.status(500).json({ error: 'Export failed', message: err.message });
  }
};
