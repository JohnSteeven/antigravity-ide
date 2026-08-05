/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  eventBus.js  —  Frontend Event Bus (Pub/Sub)
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Decouples all CMS modules. No module calls another directly.
 *  All cross-module communication goes through the event bus.
 *
 *  Event Naming Convention:
 *    cms:{entity}:{action}
 *
 *  Examples:
 *    cms:article:created      cms:article:published    cms:article:deleted
 *    cms:page:published       cms:media:uploaded       cms:user:registered
 *    cms:comment:approved     cms:form:submitted       cms:backup:completed
 *    cms:theme:changed        cms:feature:toggled      cms:setting:updated
 *
 *  Usage:
 *    // Subscribe:
 *    eventBus.on('cms:article:published', ({ articleId, slug }) => {
 *      // update search index, send newsletter, update sitemap...
 *    });
 *
 *    // Emit:
 *    eventBus.emit('cms:article:published', { articleId, slug, title });
 *
 *    // One-time:
 *    eventBus.once('cms:article:published', handler);
 *
 *    // Unsubscribe:
 *    eventBus.off('cms:article:published', handler);
 *
 *    // Wildcard (listen to all CMS events):
 *    eventBus.on('cms:*', (event, data) => console.log(event, data));
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

class EventBus {
  constructor() {
    this._listeners = new Map();  // event → Set of handlers
    this._wildcards = new Set();  // wildcard handlers
    this._history   = [];         // recent event history (for debugging)
    this._maxHistory = 50;
    this._debug     = false;
  }

  /**
   * Subscribe to an event.
   * @param {string}   event   - Event name or 'cms:*' for wildcard
   * @param {Function} handler - Receives (data, event) as arguments
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (event === 'cms:*' || event === '*') {
      this._wildcards.add(handler);
      return () => this._wildcards.delete(handler);
    }

    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe once — auto-removes after first call.
   */
  once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event, handler) {
    if (event === 'cms:*' || event === '*') {
      this._wildcards.delete(handler);
      return;
    }
    const handlers = this._listeners.get(event);
    if (handlers) handlers.delete(handler);
  }

  /**
   * Emit an event to all subscribers.
   * @param {string} event  - Event name
   * @param {*}      data   - Event payload
   */
  emit(event, data = {}) {
    if (this._debug) {
      console.debug(`[EventBus] ${event}`, data);
    }

    // Track history
    this._history.push({ event, data, timestamp: Date.now() });
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    // Notify direct subscribers
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data, event);
        } catch (err) {
          console.error(`[EventBus] Handler error for "${event}":`, err);
        }
      });
    }

    // Notify wildcard subscribers
    this._wildcards.forEach(handler => {
      try {
        handler(data, event);
      } catch (err) {
        console.error(`[EventBus] Wildcard handler error for "${event}":`, err);
      }
    });
  }

  /**
   * Async emit — waits for all handlers to resolve.
   */
  async emitAsync(event, data = {}) {
    const handlers = this._listeners.get(event) || new Set();
    const wildcards = [...this._wildcards];
    const allHandlers = [...handlers, ...wildcards];

    await Promise.allSettled(
      allHandlers.map(handler => Promise.resolve(handler(data, event)))
    );
  }

  /**
   * Remove all listeners for an event (or all events).
   */
  clear(event = null) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
      this._wildcards.clear();
    }
  }

  /**
   * Get list of registered events.
   */
  events() {
    return [...this._listeners.keys()];
  }

  /**
   * Get recent event history (for debugging).
   */
  history() {
    return [...this._history];
  }

  /**
   * Enable debug logging.
   */
  debug(enabled = true) {
    this._debug = enabled;
    return this;
  }
}

// ── Singleton instance ────────────────────────────────────────────────────────
const eventBus = new EventBus();
export default eventBus;

// ── Standard CMS Events (for autocomplete / documentation) ───────────────────
export const CMS_EVENTS = {
  // Articles
  ARTICLE_CREATED:    'cms:article:created',
  ARTICLE_UPDATED:    'cms:article:updated',
  ARTICLE_PUBLISHED:  'cms:article:published',
  ARTICLE_DELETED:    'cms:article:deleted',
  ARTICLE_SCHEDULED:  'cms:article:scheduled',
  ARTICLE_ARCHIVED:   'cms:article:archived',

  // Pages
  PAGE_CREATED:       'cms:page:created',
  PAGE_PUBLISHED:     'cms:page:published',
  PAGE_UPDATED:       'cms:page:updated',
  PAGE_DELETED:       'cms:page:deleted',

  // Media
  MEDIA_UPLOADED:     'cms:media:uploaded',
  MEDIA_DELETED:      'cms:media:deleted',
  MEDIA_MOVED:        'cms:media:moved',

  // Users
  USER_REGISTERED:    'cms:user:registered',
  USER_LOGGED_IN:     'cms:user:loggedIn',
  USER_ROLE_CHANGED:  'cms:user:roleChanged',

  // Comments
  COMMENT_CREATED:    'cms:comment:created',
  COMMENT_APPROVED:   'cms:comment:approved',
  COMMENT_DELETED:    'cms:comment:deleted',

  // Forms
  FORM_SUBMITTED:     'cms:form:submitted',

  // CMS Operations
  BACKUP_COMPLETED:   'cms:backup:completed',
  SETTING_UPDATED:    'cms:setting:updated',
  THEME_CHANGED:      'cms:theme:changed',
  FEATURE_TOGGLED:    'cms:feature:toggled',
  PLUGIN_ACTIVATED:   'cms:plugin:activated',
  PLUGIN_DEACTIVATED: 'cms:plugin:deactivated',

  // Search
  SEARCH_INDEXED:     'cms:search:indexed',
  SEARCH_DEINDEXED:   'cms:search:deindexed',
};
