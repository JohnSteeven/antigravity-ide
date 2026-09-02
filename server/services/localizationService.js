/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  localizationService.js  —  Enterprise Localization & Translation Service
 *  MyJourney CMS  |  Stage 2 — Phase 19: Localization & Translation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Locale = require('../models/Locale');
const TranslationEntry = require('../models/TranslationEntry');
const VersionControlService = require('./versionControlService');
const Article = require('../models/Article');
const Page = require('../models/Page');

const DEFAULT_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇺🇸', isDefault: true, isActive: true },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷', isDefault: false, isActive: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸', isDefault: false, isActive: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪', isDefault: false, isActive: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', flag: '🇯🇵', isDefault: false, isActive: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦', isDefault: false, isActive: true },
];

class LocalizationService {
  /**
   * Seed default supported locales if empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await Locale.countDocuments();
      if (count === 0) {
        console.info('[LocalizationService] Seeding default locale languages...');
        await Locale.insertMany(DEFAULT_LOCALES.map((l) => ({ ...l, createdBy: userId })));
        console.info(`[LocalizationService] Seeded ${DEFAULT_LOCALES.length} default locales.`);
      }
    } catch (err) {
      console.error('[LocalizationService] Seed error:', err.message);
    }
  }

  /**
   * Save or update translation entry for an entity
   */
  static async saveTranslation({ entityType, entityId, locale, translatedFields, user }) {
    await LocalizationService.seedDefaults();

    const cleanLocale = locale.toLowerCase();
    const cleanType = entityType.toLowerCase();

    let entry = await TranslationEntry.findOne({ entityType: cleanType, entityId, locale: cleanLocale });

    if (!entry) {
      entry = new TranslationEntry({
        entityId,
        entityType: cleanType,
        locale: cleanLocale,
        translatedFields,
        createdBy: user?.id || user,
        status: 'published',
      });
    } else {
      entry.translatedFields = translatedFields;
    }

    await entry.save();

    // Trigger Version Control Snapshot for translation
    await VersionControlService.createSnapshot({
      entityType: cleanType,
      entityId,
      title: `Translation (${cleanLocale.toUpperCase()})`,
      data: translatedFields,
      notes: `Saved ${cleanLocale.toUpperCase()} translation entry`,
    }).catch(() => {});

    return entry;
  }

  /**
   * Get translation for entity
   */
  static async getTranslation(entityType, entityId, locale) {
    return TranslationEntry.findOne({ entityType: entityType.toLowerCase(), entityId, locale: locale.toLowerCase() }).lean();
  }

  /**
   * Generate hreflang alternate link tags
   */
  static async getHreflangTags(entityType, entityId) {
    const baseUrl = process.env.CLIENT_URL || 'https://myjourney.com';
    const translations = await TranslationEntry.find({ entityType: entityType.toLowerCase(), entityId, status: 'published' }).lean();
    const activeLocales = await Locale.find({ isActive: true }).lean();

    const tags = activeLocales.map((loc) => {
      const hasTrans = translations.some((t) => t.locale === loc.code);
      const url = loc.isDefault ? `${baseUrl}/${entityType}/${entityId}` : `${baseUrl}/${loc.code}/${entityType}/${entityId}`;
      return {
        hreflang: loc.code,
        url,
        hasTranslation: loc.isDefault || hasTrans,
      };
    });

    return tags;
  }

  /**
   * Calculate translation progress metrics
   */
  static async getProgress() {
    const activeLocales = await Locale.find({ isActive: true }).lean();
    const totalArticles = await Article.countDocuments({ status: 'published' });

    const localeStats = await Promise.all(
      activeLocales.map(async (loc) => {
        if (loc.isDefault) return { code: loc.code, name: loc.name, translatedCount: totalArticles, progressPercent: 100 };

        const count = await TranslationEntry.countDocuments({ entityType: 'article', locale: loc.code, status: 'published' });
        const progressPercent = totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0;
        return { code: loc.code, name: loc.name, translatedCount: count, progressPercent };
      })
    );

    return { totalArticles, localeStats };
  }
}

module.exports = LocalizationService;
