/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  localizationController.js  —  Localization API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 19: Localization & Translation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Locale = require('../models/Locale');
const TranslationEntry = require('../models/TranslationEntry');
const LocalizationService = require('../services/localizationService');
const AuditLogger = require('../audit/AuditLogger');

exports.getLocales = async (req, res) => {
  try {
    await LocalizationService.seedDefaults(req.user?.id);
    const locales = await Locale.find().sort({ isDefault: -1, name: 1 }).lean();
    res.json({ success: true, data: locales });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch locales', message: err.message });
  }
};

exports.addLocale = async (req, res) => {
  try {
    const { code, name, nativeName, direction, flag, fallbackLocale } = req.body;
    const locale = new Locale({
      code,
      name,
      nativeName,
      direction,
      flag,
      fallbackLocale,
      createdBy: req.user?.id,
    });
    await locale.save();

    await AuditLogger.log({
      entity: 'locale',
      entityId: locale._id,
      action: 'create',
      userId: req.user?.id,
      after: locale,
      req,
      details: `Added new locale language '${name}' (${code})`,
    });

    res.status(201).json({ success: true, data: locale });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add locale', message: err.message });
  }
};

exports.getTranslation = async (req, res) => {
  try {
    const { entityType, entityId, locale } = req.params;
    const translation = await LocalizationService.getTranslation(entityType, entityId, locale);
    res.json({ success: true, data: translation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch translation', message: err.message });
  }
};

exports.saveTranslation = async (req, res) => {
  try {
    const { entityType, entityId, locale, translatedFields } = req.body;
    const entry = await LocalizationService.saveTranslation({
      entityType,
      entityId,
      locale,
      translatedFields,
      user: req.user,
    });

    await AuditLogger.log({
      entity: 'translation_entry',
      entityId: entry._id,
      action: 'update',
      userId: req.user?.id,
      after: entry,
      req,
      details: `Saved ${locale.toUpperCase()} translation for ${entityType} #${entityId}`,
    });

    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save translation', message: err.message });
  }
};

exports.getHreflang = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const tags = await LocalizationService.getHreflangTags(entityType, entityId);
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hreflang tags', message: err.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const progress = await LocalizationService.getProgress();
    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch translation progress', message: err.message });
  }
};
