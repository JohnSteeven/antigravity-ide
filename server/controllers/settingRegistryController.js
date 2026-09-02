/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  settingRegistryController.js  —  Settings Registry API Controller
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SettingsRegistryService = require('../services/settingsRegistryService');
const SettingsExportService = require('../services/settingsExportService');
const SettingRevision = require('../models/SettingRevision');

/**
 * GET /api/settings-registry
 * Fetch all system settings by category
 */
exports.getAllSettings = async (req, res) => {
  try {
    const { category } = req.query;
    const settings = await SettingsRegistryService.getAllSettings(category);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings', message: err.message });
  }
};

/**
 * GET /api/settings-registry/:key
 * Fetch single setting by key
 */
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await SettingsRegistryService.getByKey(key);
    if (!setting) {
      return res.status(404).json({ error: 'Not Found', message: `Setting '${key}' not found.` });
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch setting', message: err.message });
  }
};

/**
 * PUT /api/settings-registry/:key
 * Update setting value
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const value = req.body;
    const userId = req.user?.id;

    const updated = await SettingsRegistryService.updateSetting(key, value, userId, req);
    res.json({ success: true, data: updated, message: `Setting '${key}' updated successfully.` });
  } catch (err) {
    res.status(400).json({ error: 'Update Failed', message: err.message });
  }
};

/**
 * POST /api/settings-registry/register
 * Dynamically register a new setting definition
 */
exports.registerDefinition = async (req, res) => {
  try {
    const definition = req.body;
    if (!definition.key) {
      return res.status(400).json({ error: 'Missing Key', message: 'Setting definition must contain a key.' });
    }
    const setting = await SettingsRegistryService.registerDefinition(definition);
    res.status(201).json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ error: 'Registration Failed', message: err.message });
  }
};

/**
 * GET /api/settings-registry/export
 * Export all system settings to JSON
 */
exports.exportSettings = async (req, res) => {
  try {
    const exportData = await SettingsExportService.exportAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cms-settings-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: 'Export Failed', message: err.message });
  }
};

/**
 * POST /api/settings-registry/import
 * Import settings from JSON
 */
exports.importSettings = async (req, res) => {
  try {
    const importData = req.body;
    const userId = req.user?.id;
    const result = await SettingsExportService.importSettings(importData, userId);
    res.json({ success: true, message: `Imported ${result.importedCount} setting(s) successfully.` });
  } catch (err) {
    res.status(400).json({ error: 'Import Failed', message: err.message });
  }
};

/**
 * GET /api/settings-registry/:key/revisions
 * Fetch revision history for a setting key
 */
exports.getRevisions = async (req, res) => {
  try {
    const { key } = req.params;
    const revisions = await SettingRevision.find({ settingKey: key.toLowerCase() }).sort({ version: -1 });
    res.json({ success: true, data: revisions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revisions', message: err.message });
  }
};

/**
 * POST /api/settings-registry/:key/rollback/:revisionId
 * Rollback setting to a revision snapshot
 */
exports.rollbackRevision = async (req, res) => {
  try {
    const { key, revisionId } = req.params;
    const userId = req.user?.id;
    const restored = await SettingsExportService.rollbackRevision(key, revisionId, userId);
    res.json({ success: true, data: restored, message: `Setting '${key}' rolled back successfully.` });
  } catch (err) {
    res.status(400).json({ error: 'Rollback Failed', message: err.message });
  }
};
