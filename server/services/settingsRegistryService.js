/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  settingsRegistryService.js  —  Core System Settings Orchestrator
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SystemSetting = require('../models/SystemSetting');
const SettingRevision = require('../models/SettingRevision');
const SettingsCacheService = require('./settingsCacheService');
const SettingsValidationService = require('./settingsValidationService');
const SettingsExportService = require('./settingsExportService');
const AuditLogger = require('../audit/AuditLogger');

// Default initial schemas for standard CMS setting domains
const DEFAULT_SETTINGS = [
  {
    key: 'site',
    title: 'General Site Settings',
    category: 'General',
    description: 'Core website title, brand name, logo, and metadata',
    isSystem: true,
    value: { brandName: 'MyJourney', siteTitle: 'MyJourney — Personal & Tech Blog', footerText: '© 2026 MyJourney. All rights reserved.' },
    schema: {
      brandName: { type: 'text', label: 'Brand Name', required: true, default: 'MyJourney' },
      siteTitle: { type: 'text', label: 'Site Title', required: true },
      footerText: { type: 'text', label: 'Footer Text' },
    },
  },
  {
    key: 'seo',
    title: 'Search Engine Optimization',
    category: 'SEO',
    description: 'Meta titles, default description, canonical URLs, social preview image',
    isSystem: true,
    value: { metaTitle: 'MyJourney Blog', metaDescription: 'Insights on technology, code, and life.', ogImage: '' },
    schema: {
      metaTitle: { type: 'text', label: 'Default Meta Title', required: true },
      metaDescription: { type: 'textarea', label: 'Default Meta Description' },
      ogImage: { type: 'image', label: 'Social Share Image (OG Image)' },
    },
  },
  {
    key: 'theme',
    title: 'Theme & Styling Tokens',
    category: 'Theme',
    description: 'Brand color palette, typography, radii, and dark mode behavior',
    isSystem: true,
    value: { primaryColor: '#426c67', goldColor: '#b58b5f', darkMode: 'auto' },
    schema: {
      primaryColor: { type: 'color', label: 'Primary Accent Color', default: '#426c67' },
      goldColor: { type: 'color', label: 'Secondary Gold Color', default: '#b58b5f' },
      darkMode: { type: 'select', label: 'Dark Mode Behavior', options: ['auto', 'light', 'dark'] },
    },
  },
  {
    key: 'email',
    title: 'Email & SMTP Transport',
    category: 'Email',
    description: 'SMTP host, port, credentials, and notification email addresses',
    isSystem: true,
    isSecret: true,
    secretFields: ['smtpPass'],
    value: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', fromEmail: 'noreply@myjourney.com' },
    schema: {
      smtpHost: { type: 'text', label: 'SMTP Host' },
      smtpPort: { type: 'number', label: 'SMTP Port', default: 587 },
      smtpUser: { type: 'text', label: 'SMTP Username' },
      smtpPass: { type: 'password', label: 'SMTP Password' },
      fromEmail: { type: 'email', label: 'Sender Email Address' },
    },
  },
];

class SettingsRegistryService {
  /**
   * Seed default system setting documents if empty
   */
  static async seedDefaults() {
    try {
      const count = await SystemSetting.countDocuments();
      if (count === 0) {
        console.info('[SettingsRegistry] Seeding default system settings...');
        await SystemSetting.insertMany(DEFAULT_SETTINGS);
        console.info(`[SettingsRegistry] Seeded ${DEFAULT_SETTINGS.length} settings.`);
      }
    } catch (err) {
      console.error('[SettingsRegistry] Seed error:', err.message);
    }
  }

  /**
   * Get all registered system settings with secret masking
   */
  static async getAllSettings(category = null) {
    await SettingsRegistryService.seedDefaults();

    const query = category ? { category } : {};
    const settings = await SystemSetting.find(query).sort({ category: 1, key: 1 });

    return settings.map((s) => SettingsRegistryService.maskSecrets(s.toObject()));
  }

  /**
   * Get single setting by key (with caching)
   */
  static async getByKey(key) {
    const cached = await SettingsCacheService.get(key);
    if (cached) return cached;

    const setting = await SystemSetting.findOne({ key: key.toLowerCase() });
    if (!setting) return null;

    const masked = SettingsRegistryService.maskSecrets(setting.toObject());
    await SettingsCacheService.set(key, masked);
    return masked;
  }

  /**
   * Save or update setting value with schema validation, revision creation, and audit logging
   */
  static async updateSetting(key, newValue, userId = null, req = null) {
    const settingKey = key.toLowerCase();
    let setting = await SystemSetting.findOne({ key: settingKey });

    if (!setting) {
      throw new Error(`Setting '${key}' not found.`);
    }

    // 1. Validate against Schema
    if (setting.schema) {
      const validation = SettingsValidationService.validate(newValue, setting.schema);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
      }
    }

    // Preserve secrets if passed as masked (e.g. "********")
    const updatedValue = { ...newValue };
    if (setting.isSecret && setting.secretFields) {
      setting.secretFields.forEach((field) => {
        if (updatedValue[field] === '********' && setting.value?.[field]) {
          updatedValue[field] = setting.value[field]; // retain old value
        }
      });
    }

    // 2. Create Revision Snapshot before update
    await SettingsExportService.createRevision(setting, 'Setting value update', userId);

    const oldValue = setting.value;
    setting.value = updatedValue;
    setting.version = (setting.version || 1) + 1;
    setting.updatedBy = userId;

    // 3. Log Audit Entry
    setting.audit.push({
      user: userId,
      userName: req?.user?.name || 'Admin',
      action: 'update',
      changes: { before: oldValue, after: updatedValue },
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.ip) : null,
      timestamp: new Date(),
    });

    await setting.save();

    // 4. Invalidate Cache
    await SettingsCacheService.invalidate(settingKey);

    await AuditLogger.log({
      entity: 'setting',
      entityId: setting._id,
      action: 'update',
      userId,
      before: { value: oldValue },
      after: { value: updatedValue },
      req,
      details: `Updated system setting '${settingKey}'`,
    });

    return SettingsRegistryService.maskSecrets(setting.toObject());
  }

  /**
   * Register a new setting definition dynamically
   */
  static async registerDefinition(definition) {
    const key = definition.key.toLowerCase();
    let setting = await SystemSetting.findOne({ key });

    if (setting) {
      // Update schema definitions without overwriting existing user value
      setting.title = definition.title || setting.title;
      setting.category = definition.category || setting.category;
      setting.description = definition.description || setting.description;
      setting.schema = definition.schema || setting.schema;
      if (definition.icon) setting.icon = definition.icon;
      await setting.save();
    } else {
      setting = new SystemSetting({
        key,
        title: definition.title || key,
        category: definition.category || 'General',
        description: definition.description || '',
        schema: definition.schema || {},
        value: definition.value || {},
        icon: definition.icon || 'Settings',
        isSecret: definition.isSecret || false,
        secretFields: definition.secretFields || [],
      });
      await setting.save();
    }

    await SettingsCacheService.invalidate(key);
    return setting;
  }

  /**
   * Mask secret fields in value object
   */
  static maskSecrets(settingObj) {
    if (!settingObj || !settingObj.isSecret || !settingObj.secretFields || !settingObj.value) {
      return settingObj;
    }

    const valueCopy = { ...settingObj.value };
    settingObj.secretFields.forEach((field) => {
      if (valueCopy[field]) {
        valueCopy[field] = '********';
      }
    });

    return { ...settingObj, value: valueCopy };
  }
}

module.exports = SettingsRegistryService;
