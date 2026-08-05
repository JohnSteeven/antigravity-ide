/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  themeController.js  —  Design System Theme API Controller
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Theme = require('../models/Theme');
const ThemeService = require('../services/themeService');
const AuditLogger = require('../audit/AuditLogger');

exports.getThemes = async (req, res) => {
  try {
    await ThemeService.seedDefaults(req.user?.id);
    const themes = await Theme.find().sort({ isDefault: -1, isBuiltIn: -1, name: 1 }).lean();
    res.json({ success: true, data: themes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch themes', message: err.message });
  }
};

exports.getActiveTheme = async (req, res) => {
  try {
    const active = await ThemeService.getActiveTheme();
    const cssVariables = ThemeService.generateCSSVariables(active);
    res.json({ success: true, data: active, cssVariables });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active theme', message: err.message });
  }
};

exports.getThemeById = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ error: 'Not Found', message: 'Theme not found' });
    const cssVariables = ThemeService.generateCSSVariables(theme);
    res.json({ success: true, data: theme, cssVariables });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch theme', message: err.message });
  }
};

exports.createTheme = async (req, res) => {
  try {
    const { key, name, description, mode, tokens, customCSS } = req.body;
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const existing = await Theme.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Theme key '${cleanKey}' already exists.` });
    }

    const theme = new Theme({
      key: cleanKey,
      name,
      slug: cleanKey,
      description: description || '',
      mode: mode || 'light',
      tokens: tokens || {},
      customCSS: customCSS || '',
      createdBy: req.user?.id,
    });

    await theme.save();
    res.status(201).json({ success: true, data: theme });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create theme', message: err.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ error: 'Not Found', message: 'Theme not found' });

    const oldDoc = theme.toObject();
    const { name, description, mode, tokens, customCSS, status } = req.body;

    if (name !== undefined) theme.name = name;
    if (description !== undefined) theme.description = description;
    if (mode !== undefined) theme.mode = mode;
    if (tokens !== undefined) theme.tokens = tokens;
    if (customCSS !== undefined) theme.customCSS = customCSS;
    if (status !== undefined) theme.status = status;

    theme.version = (theme.version || 1) + 1;
    theme.updatedBy = req.user?.id;

    await theme.save();

    await AuditLogger.log({
      entity: 'theme',
      entityId: theme._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: theme,
      req,
      details: `Updated theme '${theme.name}' to version v${theme.version}`,
    });

    res.json({ success: true, data: theme });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update theme', message: err.message });
  }
};

exports.publishTheme = async (req, res) => {
  try {
    const theme = await ThemeService.setActiveTheme(req.params.id, req.user?.id);
    if (!theme) return res.status(404).json({ error: 'Not Found', message: 'Theme not found' });
    const cssVariables = ThemeService.generateCSSVariables(theme);
    res.json({ success: true, data: theme, cssVariables, message: `Theme '${theme.name}' is now the default active theme.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate theme', message: err.message });
  }
};

exports.deleteTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ error: 'Not Found', message: 'Theme not found' });
    if (theme.isDefault) {
      return res.status(400).json({ error: 'Active Theme Protected', message: 'Cannot delete the active default theme.' });
    }

    await Theme.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Theme '${theme.name}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete theme', message: err.message });
  }
};
