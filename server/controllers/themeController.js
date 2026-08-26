/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  themeController.js  —  Design System Theme API Controller
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Theme = require('../models/Theme');
const ThemeService = require('../services/themeService');
const AuditLogger = require('../audit/AuditLogger');
const {
  analyzeThemeAccessibility,
  assertThemePayload,
  safeStoredTokens,
  sanitizeThemeTokens,
} = require('../services/themeSafety');

const sendThemeError = (res, err, fallback) => res.status(err.status || 500).json({
  error: err.code || fallback,
  message: err.message,
  ...(err.details ? { details: err.details } : {}),
});

const serializePublicTheme = (theme) => {
  if (!theme) return null;
  const source = typeof theme.toObject === 'function' ? theme.toObject() : theme;
  return {
    _id: source._id,
    key: source.key,
    name: source.name,
    slug: source.slug,
    description: source.description,
    mode: source.mode,
    tokens: source.tokens,
    version: source.version,
    accessibility: analyzeThemeAccessibility(source),
  };
};

exports.getThemes = async (req, res) => {
  try {
    await ThemeService.seedDefaults(req.user?.id);
    const themes = await Theme.find().sort({ isDefault: -1, isBuiltIn: -1, name: 1 }).lean();
    res.json({ success: true, data: themes });
  } catch (err) {
    sendThemeError(res, err, 'Failed to fetch themes');
  }
};

exports.getActiveTheme = async (req, res) => {
  try {
    const active = await ThemeService.getActiveTheme();
    const cssVariables = ThemeService.generateCSSVariables(active);
    res.json({ success: true, data: serializePublicTheme(active), cssVariables });
  } catch (err) {
    sendThemeError(res, err, 'Failed to fetch active theme');
  }
};

exports.getThemeById = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ error: 'Not Found', message: 'Theme not found' });
    const cssVariables = ThemeService.generateCSSVariables(theme);
    res.json({ success: true, data: theme, cssVariables, accessibility: analyzeThemeAccessibility(theme) });
  } catch (err) {
    sendThemeError(res, err, 'Failed to fetch theme');
  }
};

exports.createTheme = async (req, res) => {
  try {
    assertThemePayload(req.body);
    const { key, name, description, mode, tokens } = req.body;
    const cleanKey = String(key || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!cleanKey || !String(name || '').trim()) {
      return res.status(400).json({ error: 'THEME_REQUIRED_FIELDS', message: 'Theme key and name are required.' });
    }

    const existing = await Theme.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Theme key '${cleanKey}' already exists.` });
    }

    const theme = new Theme({
      key: cleanKey,
      name: String(name).trim().slice(0, 120),
      slug: cleanKey,
      description: description || '',
      mode: mode || 'light',
      tokens: tokens ? safeStoredTokens(sanitizeThemeTokens(tokens), mode || 'light') : safeStoredTokens({}, mode || 'light'),
      createdBy: req.user?.id,
    });

    await theme.save();
    res.status(201).json({ success: true, data: theme });
  } catch (err) {
    sendThemeError(res, err, 'Failed to create theme');
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ error: 'Not Found', message: 'Theme not found' });

    const oldDoc = theme.toObject();
    assertThemePayload(req.body);
    const { name, description, mode, tokens, status } = req.body;

    if (name !== undefined) theme.name = name;
    if (description !== undefined) theme.description = description;
    if (mode !== undefined) theme.mode = mode;
    if (tokens !== undefined) theme.tokens = safeStoredTokens(sanitizeThemeTokens(tokens), mode || theme.mode);
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
    sendThemeError(res, err, 'Failed to update theme');
  }
};

exports.publishTheme = async (req, res) => {
  try {
    const theme = await ThemeService.setActiveTheme(req.params.id, req.user?.id);
    if (!theme) return res.status(404).json({ error: 'Not Found', message: 'Theme not found' });
    const cssVariables = ThemeService.generateCSSVariables(theme);
    res.json({
      success: true,
      data: theme,
      cssVariables,
      accessibility: analyzeThemeAccessibility(theme),
      message: `Theme '${theme.name}' is now the default active theme.`,
    });
  } catch (err) {
    sendThemeError(res, err, 'Failed to activate theme');
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
    sendThemeError(res, err, 'Failed to delete theme');
  }
};
