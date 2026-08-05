/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pluginService.js  —  Enterprise Plugin & Extension Service Layer
 *  MyJourney CMS  |  Stage 2 — Phase 15: Plugin Manager & Extension Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PluginManifest = require('../models/PluginManifest');
const hookRunner = require('../core/hookRunner');

const DEFAULT_PLUGINS = [
  {
    pluginId: 'ai-seo-optimizer',
    name: 'AI SEO Metadata & Schema Optimizer',
    version: '1.2.0',
    description: 'Auto-generates META titles, descriptions, and JSON-LD schema markup for Articles & Pages.',
    author: 'MyJourney AI Team',
    category: 'SEO',
    icon: 'Search',
    status: 'active',
    registeredHooks: ['beforePublish', 'afterCreate'],
    permissions: ['seo.manage'],
    settings: { autoGenerateMeta: true, model: 'gemini-1.5-flash' },
  },
  {
    pluginId: 'ga4-analytics-pro',
    name: 'Google Analytics 4 & Real-Time Heatmaps',
    version: '2.0.1',
    description: 'Integrates GA4 web traffic measurement, event tracking, and conversion analytics.',
    author: 'Analytics Core',
    category: 'Analytics',
    icon: 'Activity',
    status: 'active',
    registeredHooks: ['afterRender', 'afterPublish'],
    permissions: ['analytics.view'],
    settings: { measurementId: 'G-MYJOURNEY01' },
  },
  {
    pluginId: 'stripe-checkout-pay',
    name: 'Stripe Payment & Subscription Gateway',
    version: '1.0.4',
    description: 'Accept credit card payments, digital downloads, and recurring membership subscriptions.',
    author: 'Fintech Plugins',
    category: 'Payment',
    icon: 'CreditCard',
    status: 'inactive',
    registeredHooks: ['beforeCreate', 'afterWorkflow'],
    permissions: ['payment.manage'],
    settings: { currency: 'usd', testMode: true },
  },
  {
    pluginId: 'social-share-pro',
    name: 'Social Media Auto-Share Engine',
    version: '1.1.0',
    description: 'Automatically cross-posts published articles to Twitter/X, LinkedIn, and Facebook.',
    author: 'Social Labs',
    category: 'Marketing',
    icon: 'Share2',
    status: 'active',
    registeredHooks: ['afterPublish'],
    permissions: ['social.share'],
    settings: { autoTweet: true },
  },
];

class PluginService {
  /**
   * Seed default plugins if empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await PluginManifest.countDocuments();
      if (count === 0) {
        console.info('[PluginService] Seeding default extension plugins...');
        await PluginManifest.insertMany(DEFAULT_PLUGINS.map((p) => ({ ...p, createdBy: userId })));
        console.info(`[PluginService] Seeded ${DEFAULT_PLUGINS.length} default plugins.`);
      }
    } catch (err) {
      console.error('[PluginService] Seed error:', err.message);
    }
  }

  /**
   * Activate plugin
   */
  static async activatePlugin(pluginId) {
    const plugin = await PluginManifest.findOne({ pluginId: pluginId.toLowerCase() });
    if (!plugin) throw new Error(`Plugin '${pluginId}' not found.`);

    plugin.status = 'active';
    await plugin.save();
    return plugin;
  }

  /**
   * Deactivate plugin
   */
  static async deactivatePlugin(pluginId) {
    const plugin = await PluginManifest.findOne({ pluginId: pluginId.toLowerCase() });
    if (!plugin) throw new Error(`Plugin '${pluginId}' not found.`);

    plugin.status = 'inactive';
    await plugin.save();
    return plugin;
  }

  /**
   * Execute registered plugin hooks
   */
  static async triggerHook(hookName, payload) {
    const activePlugins = await PluginManifest.find({ status: 'active', registeredHooks: hookName }).lean();

    for (const plugin of activePlugins) {
      try {
        await hookRunner.run(hookName, { ...payload, pluginId: plugin.pluginId });
      } catch (err) {
        console.warn(`[PluginService] Hook '${hookName}' failed for plugin '${plugin.name}':`, err.message);
      }
    }
  }

  /**
   * Health Check on all plugins
   */
  static async runHealthCheck() {
    const plugins = await PluginManifest.find().lean();
    return plugins.map((p) => ({
      pluginId: p.pluginId,
      name: p.name,
      status: p.status,
      isHealthy: p.status !== 'error',
      issues: p.status === 'error' ? ['Plugin initialization failed.'] : [],
    }));
  }
}

module.exports = PluginService;
