/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  apiRegistry.js  —  Server-Side Route Self-Registration
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Eliminates the 35-line import block in server/index.js.
 *  Every module registers its own routes.
 *
 *  Before (server/index.js):
 *    const articleRoutes = require('./routes/articleRoutes');
 *    app.use('/api/articles', authenticate, articleRoutes);
 *    // × 20 more times...
 *
 *  After (articleRoutes.js registers itself):
 *    apiRegistry.register({ name: 'Articles', prefix: '/api/articles', router, middleware: [authenticate] });
 *
 *  After (server/index.js):
 *    apiRegistry.mountAll(app);  // one line mounts everything
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const _modules = [];

const apiRegistry = {
  /**
   * Register a module's routes with the API registry.
   *
   * @param {object} config
   * @param {string}   config.name         Module name (for logging/health)
   * @param {string}   config.prefix        URL prefix (e.g. '/api/articles')
   * @param {object}   config.router        Express Router instance
   * @param {Array}    config.middleware     Middleware applied before all routes (e.g. [authenticate])
   * @param {string[]} config.permissions   Required permissions (for future RBAC middleware)
   * @param {string}   config.version       API version (e.g. '1.0.0')
   * @param {boolean}  config.public        If true, no auth required (default: false)
   * @param {boolean}  config.disabled      If true, module is not mounted (default: false)
   */
  register(config) {
    if (!config.name)   throw new Error(`[API Registry] "name" is required`);
    if (!config.prefix) throw new Error(`[API Registry] "prefix" is required for module "${config.name}"`);
    if (!config.router) throw new Error(`[API Registry] "router" is required for module "${config.name}"`);

    if (config.disabled) {
      console.info(`[API Registry] ⏭  Module "${config.name}" is disabled — skipping`);
      return;
    }

    // Prevent duplicate registrations
    const existing = _modules.find(m => m.prefix === config.prefix);
    if (existing) {
      console.warn(`[API Registry] ⚠  Prefix "${config.prefix}" already registered by "${existing.name}" — overwriting with "${config.name}"`);
      const idx = _modules.indexOf(existing);
      _modules[idx] = buildEntry(config);
      return;
    }

    _modules.push(buildEntry(config));
  },

  /**
   * Mount all registered modules onto an Express app.
   * Call once in server/index.js after all routes have self-registered.
   *
   * @param {object} app  Express application
   */
  mountAll(app) {
    const sorted = [..._modules].sort((a, b) => (a.order || 99) - (b.order || 99));

    for (const mod of sorted) {
      const middlewares = mod.middleware || [];
      app.use(mod.prefix, ...middlewares, mod.router);
      console.info(`[API Registry] ✅ Mounted: ${mod.name.padEnd(28)} ${mod.prefix}`);
    }

    console.info(`[API Registry] 🚀 ${sorted.length} modules mounted.`);
  },

  /**
   * Get all registered module manifests (for health monitoring, docs, etc.)
   */
  getModules() {
    return _modules.map(({ name, prefix, version, permissions, public: isPublic }) => ({
      name, prefix, version, permissions, isPublic,
    }));
  },

  /**
   * Check if a prefix is registered.
   */
  has(prefix) {
    return _modules.some(m => m.prefix === prefix);
  },
};

function buildEntry(config) {
  return {
    name:        config.name,
    prefix:      config.prefix,
    router:      config.router,
    middleware:  config.middleware  || [],
    permissions: config.permissions || [],
    version:     config.version     || '1.0.0',
    public:      config.public      ?? false,
    order:       config.order       ?? 50,
    registeredAt: Date.now(),
  };
}

module.exports = apiRegistry;
