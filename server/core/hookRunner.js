/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  hookRunner.js  —  Lifecycle Hook Executor
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Executes registered lifecycle hooks in order.
 *  Hook failures are caught and logged — they never break the main flow.
 *
 *  Hook naming convention:
 *    {timing}:{entity}
 *    beforeCreate:article   afterCreate:article
 *    beforeUpdate:page      afterUpdate:page
 *    beforeDelete:media     afterDelete:media
 *    afterPublish:article   afterPublish:page
 *    afterUpload:media
 *    afterLogin:user
 *    afterPublish:*         (wildcard — runs for all entity publishes)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const _hooks = new Map(); // hookName → [{ module, handler, priority }]

const hookRunner = {
  /**
   * Register a lifecycle hook handler.
   *
   * @param {string}   hookName   e.g. 'afterPublish:article'
   * @param {Function} handler    Async function receiving (context) → context
   * @param {object}   options
   * @param {string}   options.module    Module that registered this hook
   * @param {number}   options.priority  Lower runs first (default: 50)
   */
  register(hookName, handler, { module: moduleName = 'unknown', priority = 50 } = {}) {
    if (!hookName) throw new Error('[HookRunner] hookName is required');
    if (typeof handler !== 'function') throw new Error('[HookRunner] handler must be a function');

    if (!_hooks.has(hookName)) _hooks.set(hookName, []);

    _hooks.get(hookName).push({ module: moduleName, handler, priority });

    // Keep sorted by priority
    _hooks.get(hookName).sort((a, b) => a.priority - b.priority);
  },

  /**
   * Run all handlers for a hook.
   *
   * Context is passed through each handler — handlers can modify it.
   * Handlers can return an object to merge into context.
   *
   * @param {string} hookName   e.g. 'afterPublish:article'
   * @param {object} context    Initial context data
   * @returns {object}          Final context after all handlers
   */
  async run(hookName, context = {}) {
    const handlers = [
      ...(_hooks.get(hookName) || []),
      ...(_hooks.get(`${hookName.split(':')[0]}:*`) || []),  // timing wildcards
      ...(_hooks.get('*') || []),                             // global wildcard
    ];

    let ctx = { ...context, _hook: hookName, _timestamp: Date.now() };

    for (const { module: moduleName, handler } of handlers) {
      try {
        const result = await handler(ctx);
        if (result && typeof result === 'object') {
          ctx = { ...ctx, ...result };
        }
      } catch (err) {
        console.error(`[HookRunner] ❌ Error in "${hookName}" handler from module "${moduleName}":`, err.message);
        // Non-fatal — continue with next handler
      }
    }

    return ctx;
  },

  /**
   * List all registered hooks (for debugging/docs).
   */
  list() {
    const result = {};
    for (const [name, handlers] of _hooks) {
      result[name] = handlers.map(h => ({ module: h.module, priority: h.priority }));
    }
    return result;
  },

  /**
   * Remove all handlers for a hook (e.g. when a plugin deactivates).
   */
  removeByModule(moduleName) {
    for (const [name, handlers] of _hooks) {
      const filtered = handlers.filter(h => h.module !== moduleName);
      _hooks.set(name, filtered);
    }
  },
};

module.exports = hookRunner;
