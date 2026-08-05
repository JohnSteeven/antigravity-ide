/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  settingsExportService.js  —  Settings Import/Export & Revision Service
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SystemSetting = require('../models/SystemSetting');
const SettingRevision = require('../models/SettingRevision');
const SettingsCacheService = require('./settingsCacheService');

class SettingsExportService {
  /**
   * Export all system settings to JSON object
   */
  static async exportAll() {
    const settings = await SystemSetting.find().lean();
    // Mask secrets before export
    const cleanSettings = settings.map((s) => {
      const copy = { ...s };
      if (copy.isSecret && copy.secretFields && copy.value) {
        copy.secretFields.forEach((field) => {
          if (copy.value[field]) copy.value[field] = '********';
        });
      }
      return copy;
    });

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: settings.length,
      settings: cleanSettings,
    };
  }

  /**
   * Import settings from JSON payload
   */
  static async importSettings(importData, userId = null) {
    if (!importData || !Array.isArray(importData.settings)) {
      throw new Error('Invalid import format. JSON must contain a "settings" array.');
    }

    let importedCount = 0;
    for (const item of importData.settings) {
      if (!item.key) continue;

      let setting = await SystemSetting.findOne({ key: item.key.toLowerCase() });
      if (setting) {
        // Create revision snapshot before overwriting
        await SettingExportService.createRevision(setting, 'Import overwrite', userId);
        setting.value = item.value;
        setting.updatedBy = userId;
        await setting.save();
      } else {
        setting = new SystemSetting({
          key: item.key.toLowerCase(),
          title: item.title || item.key,
          category: item.category || 'General',
          value: item.value,
          schema: item.schema || {},
          isSecret: item.isSecret || false,
          secretFields: item.secretFields || [],
          updatedBy: userId,
        });
        await setting.save();
      }
      await SettingsCacheService.invalidate(item.key);
      importedCount++;
    }

    return { importedCount };
  }

  /**
   * Create a revision snapshot
   */
  static async createRevision(settingDoc, reason = 'Setting updated', userId = null) {
    try {
      const revision = new SettingRevision({
        settingKey: settingDoc.key,
        settingId: settingDoc._id,
        version: settingDoc.version || 1,
        value: settingDoc.value,
        reason,
        createdBy: userId,
      });
      await revision.save();
    } catch (err) {
      console.error('[SettingsExportService] Revision error:', err.message);
    }
  }

  /**
   * Rollback setting to a specific revision version
   */
  static async rollbackRevision(settingKey, revisionId, userId = null) {
    const revision = await SettingRevision.findById(revisionId);
    if (!revision || revision.settingKey !== settingKey) {
      throw new Error('Revision not found for this setting key.');
    }

    const setting = await SystemSetting.findOne({ key: settingKey });
    if (!setting) throw new Error('System setting not found.');

    // Save current version as revision first
    await SettingsExportService.createRevision(setting, `Rollback to v${revision.version}`, userId);

    setting.value = revision.value;
    setting.version = (setting.version || 1) + 1;
    setting.updatedBy = userId;
    await setting.save();

    await SettingsCacheService.invalidate(settingKey);
    return setting;
  }
}

module.exports = SettingsExportService;
