/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  moduleRegistry.js  —  Module Manifest Registry
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Every CMS module (existing and new) registers its metadata here.
 *  Used by: health checks, dependency resolution, permission discovery,
 *           the CMS Plugin Manager, and the Installer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const _modules  = new Map();
const _statuses = new Map(); // key → { status, message, checkedAt }

const moduleRegistry = {
  /**
   * Register a CMS module.
   *
   * @param {object} manifest
   * @param {string}   manifest.key          Unique module key (e.g. 'articles')
   * @param {string}   manifest.name         Display name
   * @param {string}   manifest.version      Semver version
   * @param {string}   manifest.description  Short description
   * @param {string}   manifest.author       Author
   * @param {string[]} manifest.permissions  Permission keys this module provides
   * @param {string[]} manifest.dependencies Keys of modules this module requires
   * @param {object}   manifest.hooks        { beforeCreate, afterCreate, ... }
   * @param {boolean}  manifest.isBuiltIn    Is this a core built-in module?
   * @param {boolean}  manifest.isEnabled    Can be disabled via feature flags
   * @param {Function} manifest.healthCheck  Optional async fn → { status, message }
   */
  register(manifest) {
    if (!manifest.key)  throw new Error(`[Module Registry] "key" is required`);
    if (!manifest.name) throw new Error(`[Module Registry] "name" is required for key "${manifest.key}"`);

    _modules.set(manifest.key, {
      version:      manifest.version      || '1.0.0',
      description:  manifest.description  || '',
      author:       manifest.author       || 'MyJourney',
      permissions:  manifest.permissions  || [],
      dependencies: manifest.dependencies || [],
      hooks:        manifest.hooks        || {},
      isBuiltIn:    manifest.isBuiltIn    ?? false,
      isEnabled:    manifest.isEnabled    ?? true,
      healthCheck:  manifest.healthCheck  || null,
      registeredAt: Date.now(),
      ...manifest,
    });
  },

  /**
   * Get a registered module manifest.
   */
  get(key) { return _modules.get(key); },

  /**
   * Get all registered modules.
   */
  getAll() { return Object.fromEntries(_modules); },

  /**
   * Get all module keys.
   */
  keys() { return [..._modules.keys()]; },

  /**
   * Get all permissions exposed across all modules.
   * Used to build the permission management UI.
   */
  getAllPermissions() {
    const permissions = [];
    for (const [key, mod] of _modules) {
      for (const perm of (mod.permissions || [])) {
        permissions.push({ module: key, moduleName: mod.name, permission: perm });
      }
    }
    return permissions;
  },

  /**
   * Resolve dependency order for a set of modules.
   * Returns modules sorted so dependencies come first.
   */
  resolveDependencies(keys = null) {
    const targets = keys ? new Set(keys) : new Set(_modules.keys());
    const ordered = [];
    const visited = new Set();

    const visit = (key) => {
      if (visited.has(key)) return;
      visited.add(key);
      const mod = _modules.get(key);
      if (!mod) {
        console.warn(`[Module Registry] Unknown dependency: "${key}"`);
        return;
      }
      for (const dep of (mod.dependencies || [])) visit(dep);
      ordered.push(key);
    };

    for (const key of targets) visit(key);
    return ordered.map(k => _modules.get(k));
  },

  /**
   * Check if all dependencies for a module are satisfied.
   */
  checkDependencies(key) {
    const mod = _modules.get(key);
    if (!mod) return { ok: false, missing: [key] };

    const missing = (mod.dependencies || []).filter(dep => !_modules.has(dep));
    return { ok: missing.length === 0, missing };
  },

  /**
   * Run health checks for all modules that have one.
   * Returns { key, name, status, message, checkedAt }[]
   */
  async runHealthChecks() {
    const results = [];

    for (const [key, mod] of _modules) {
      if (!mod.healthCheck) {
        results.push({ key, name: mod.name, status: 'unknown', message: 'No health check defined', checkedAt: Date.now() });
        continue;
      }

      try {
        const result = await Promise.race([
          mod.healthCheck(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        const entry = { key, name: mod.name, checkedAt: Date.now(), ...result };
        _statuses.set(key, entry);
        results.push(entry);
      } catch (err) {
        const entry = { key, name: mod.name, status: 'error', message: err.message, checkedAt: Date.now() };
        _statuses.set(key, entry);
        results.push(entry);
      }
    }

    return results;
  },

  /**
   * Get the last known health status for a module.
   */
  getHealth(key) {
    return _statuses.get(key) || { key, status: 'unknown', message: 'Not yet checked' };
  },
};

module.exports = moduleRegistry;
