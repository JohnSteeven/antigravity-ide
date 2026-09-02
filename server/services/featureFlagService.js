/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  featureFlagService.js  —  Feature Flag Evaluation & Management Service
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FeatureFlag = require('../models/FeatureFlag');
const config = require('../config/configRegistry');

// Initial seed definitions for core CMS features
const DEFAULT_FEATURE_FLAGS = [
  { key: 'homepage', name: 'Homepage', description: 'Public home landing page', group: 'Core', status: 'enabled' },
  { key: 'articles', name: 'Articles Module', description: 'Blog and article management', group: 'Content', status: 'enabled' },
  { key: 'categories', name: 'Categories & Taxonomy', description: 'Category and tag management', group: 'Content', status: 'enabled' },
  { key: 'medialibrary', name: 'Media Library 2.0', description: 'Assets & file manager', group: 'Content', status: 'enabled' },
  { key: 'websitebuilder', name: 'Website Builder', description: 'Dynamic visual page builder', group: 'Experience', status: 'enabled', dependencies: ['medialibrary', 'layoutmanager'] },
  { key: 'layoutmanager', name: 'Layout Manager', description: 'DB-driven category & page layouts', group: 'Experience', status: 'enabled' },
  { key: 'themebuilder', name: 'Theme Builder', description: 'Live CSS variable theme editor', group: 'Experience', status: 'enabled' },
  { key: 'navigationbuilder', name: 'Navigation Builder', description: 'Multi-zone menu management', group: 'Experience', status: 'enabled' },
  { key: 'contenttypemanager', name: 'Content Type Manager', description: 'Custom dynamic taxonomy builder', group: 'Content', status: 'enabled' },
  { key: 'comments', name: 'Comments System', description: 'Reader comments and moderation', group: 'Core', status: 'enabled' },
  { key: 'gallery', name: 'Gallery Plugin', description: 'Photo albums & portfolios', group: 'Plugins', status: 'enabled', dependencies: ['medialibrary'] },
  { key: 'testimonials', name: 'Testimonials Plugin', description: 'Customer quotes & reviews', group: 'Plugins', status: 'enabled' },
  { key: 'newsletter', name: 'Newsletter Module', description: 'Subscribers & campaign delivery', group: 'Marketing', status: 'enabled' },
  { key: 'aiassistant', name: 'AI Assistant', description: 'Generative AI content writing helper', group: 'Future', status: 'private' },
];

class FeatureFlagService {
  /**
   * Seed default flags if database is empty
   */
  static async seedDefaults() {
    try {
      const count = await FeatureFlag.countDocuments();
      if (count === 0) {
        console.info('[FeatureFlag] Seeding default feature flags...');
        await FeatureFlag.insertMany(DEFAULT_FEATURE_FLAGS);
        console.info(`[FeatureFlag] Seeded ${DEFAULT_FEATURE_FLAGS.length} feature flags.`);
      }
    } catch (err) {
      console.error('[FeatureFlag] Error seeding feature flags:', err.message);
    }
  }

  /**
   * Evaluate if a feature is enabled for a given context
   *
   * @param {string} flagKey
   * @param {object} context - { userRole, environment, userId }
   */
  static async evaluate(flagKey, context = {}) {
    const flag = await FeatureFlag.findOne({ key: flagKey.toLowerCase() });
    if (!flag) {
      // Unregistered feature defaults to enabled for backward compatibility
      return { allowed: true, status: 'enabled', reason: 'Unregistered flag' };
    }

    const currentEnv = context.environment || config.get('server.env', 'development');
    const userRole = context.userRole || 'public';
    const now = new Date();

    // 1. Check Status
    if (flag.status === 'disabled') {
      return { allowed: false, status: 'disabled', reason: 'Feature is disabled' };
    }

    if (flag.status === 'maintenance') {
      // Admins bypass maintenance mode
      if (userRole === 'admin') {
        return { allowed: true, status: 'maintenance', reason: 'Admin bypass during maintenance' };
      }
      return { allowed: false, status: 'maintenance', reason: 'Feature is currently in maintenance mode' };
    }

    // 2. Check Environment restriction
    if (flag.allowedEnvironments?.length > 0 && !flag.allowedEnvironments.includes(currentEnv)) {
      return { allowed: false, status: flag.status, reason: `Not enabled for environment: ${currentEnv}` };
    }

    // 3. Check Scheduled Start & End dates
    if (flag.startDate && now < new Date(flag.startDate)) {
      return { allowed: false, status: 'scheduled', reason: 'Feature launch date has not arrived yet' };
    }
    if (flag.endDate && now > new Date(flag.endDate)) {
      return { allowed: false, status: 'expired', reason: 'Feature flag schedule has expired' };
    }

    // 4. Check Role restrictions for Beta / Private
    if (flag.status === 'beta' || flag.status === 'private') {
      if (flag.allowedRoles?.length > 0 && !flag.allowedRoles.includes(userRole)) {
        return { allowed: false, status: flag.status, reason: `Role ${userRole} is not granted access to ${flag.status} feature` };
      }
    }

    // 5. Check Percentage Rollout (hash-based or randomized)
    if (flag.percentageRollout < 100) {
      const hash = context.userId
        ? FeatureFlagService._hashString(context.userId + flag.key) % 100
        : Math.floor(Math.random() * 100);
      if (hash >= flag.percentageRollout) {
        return { allowed: false, status: flag.status, reason: 'Outside percentage rollout bucket' };
      }
    }

    // 6. Check Dependencies
    if (flag.dependencies && flag.dependencies.length > 0) {
      for (const depKey of flag.dependencies) {
        const depEval = await FeatureFlagService.evaluate(depKey, context);
        if (!depEval.allowed) {
          return { allowed: false, status: flag.status, reason: `Required dependency '${depKey}' is disabled` };
        }
      }
    }

    return { allowed: true, status: flag.status, flag };
  }

  /**
   * Check dependent features before disabling a feature
   * Returns list of features that depend on this feature
   */
  static async checkDependents(flagKey) {
    const dependents = await FeatureFlag.find({ dependencies: flagKey.toLowerCase(), status: { $ne: 'disabled' } });
    return dependents.map(d => ({ key: d.key, name: d.name, status: d.status }));
  }

  static _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

module.exports = FeatureFlagService;
