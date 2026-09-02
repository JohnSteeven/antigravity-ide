/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pluginController.js  —  Plugin API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 15: Plugin Manager & Extension Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PluginManifest = require('../models/PluginManifest');
const PluginService = require('../services/pluginService');
const AuditLogger = require('../audit/AuditLogger');

exports.getPlugins = async (req, res) => {
  try {
    await PluginService.seedDefaults(req.user?.id);
    const plugins = await PluginManifest.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: plugins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plugins', message: err.message });
  }
};

exports.getPluginById = async (req, res) => {
  try {
    const plugin = await PluginManifest.findOne({ pluginId: req.params.id.toLowerCase() });
    if (!plugin) return res.status(404).json({ error: 'Not Found', message: 'Plugin not found' });
    res.json({ success: true, data: plugin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plugin', message: err.message });
  }
};

exports.installPlugin = async (req, res) => {
  try {
    const { pluginId, name, version, description, category, icon, settings, permissions } = req.body;
    const plugin = new PluginManifest({
      pluginId,
      name,
      version,
      description,
      category,
      icon,
      settings,
      permissions,
      status: 'active',
      createdBy: req.user?.id,
    });

    await plugin.save();

    await AuditLogger.log({
      entity: 'plugin_manifest',
      entityId: plugin._id,
      action: 'install',
      userId: req.user?.id,
      after: plugin,
      req,
      details: `Installed plugin '${name}' (${pluginId})`,
    });

    res.status(201).json({ success: true, data: plugin });
  } catch (err) {
    res.status(500).json({ error: 'Plugin installation failed', message: err.message });
  }
};

exports.activatePlugin = async (req, res) => {
  try {
    const plugin = await PluginService.activatePlugin(req.params.id);
    await AuditLogger.log({
      entity: 'plugin_manifest',
      entityId: plugin._id,
      action: 'activate',
      userId: req.user?.id,
      after: plugin,
      req,
      details: `Activated plugin '${plugin.name}'`,
    });
    res.json({ success: true, data: plugin });
  } catch (err) {
    res.status(500).json({ error: 'Activation failed', message: err.message });
  }
};

exports.deactivatePlugin = async (req, res) => {
  try {
    const plugin = await PluginService.deactivatePlugin(req.params.id);
    await AuditLogger.log({
      entity: 'plugin_manifest',
      entityId: plugin._id,
      action: 'deactivate',
      userId: req.user?.id,
      after: plugin,
      req,
      details: `Deactivated plugin '${plugin.name}'`,
    });
    res.json({ success: true, data: plugin });
  } catch (err) {
    res.status(500).json({ error: 'Deactivation failed', message: err.message });
  }
};

exports.runHealthCheck = async (req, res) => {
  try {
    const report = await PluginService.runHealthCheck();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ error: 'Health check failed', message: err.message });
  }
};
