/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  eventBus.js  —  Server-Side Event Bus
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Server-side pub/sub event system.
 *  Mirrors the frontend eventBus but runs in Node.js context.
 *
 *  Used for:
 *    - Decoupling controllers from services
 *    - Triggering background jobs on content events
 *    - Future: WebSocket notifications to connected CMS clients
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { EventEmitter } = require('events');

class CmsEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase for many modules
    this._debug = process.env.DEBUG === 'true';
  }

  /**
   * Emit a CMS event.
   * @param {string} event   e.g. 'cms:article:published'
   * @param {object} data    Event payload
   */
  emit(event, data = {}) {
    if (this._debug) {
      console.debug(`[EventBus] ↗ ${event}`, data);
    }
    return super.emit(event, { ...data, _event: event, _timestamp: Date.now() });
  }

  /**
   * Async emit — waits for all async listeners.
   */
  async emitAsync(event, data = {}) {
    const listeners = this.listeners(event);
    const payload = { ...data, _event: event, _timestamp: Date.now() };

    await Promise.allSettled(
      listeners.map(fn => Promise.resolve(fn(payload)))
    );
  }

  /**
   * Subscribe (alias for on, returns unsubscribe fn).
   */
  subscribe(event, handler) {
    this.on(event, handler);
    return () => this.off(event, handler);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
const eventBus = new CmsEventBus();

// ── Standard CMS Event Names ──────────────────────────────────────────────────
const CMS_EVENTS = {
  ARTICLE_CREATED:   'cms:article:created',
  ARTICLE_UPDATED:   'cms:article:updated',
  ARTICLE_PUBLISHED: 'cms:article:published',
  ARTICLE_DELETED:   'cms:article:deleted',
  ARTICLE_SCHEDULED: 'cms:article:scheduled',

  PAGE_CREATED:      'cms:page:created',
  PAGE_PUBLISHED:    'cms:page:published',
  PAGE_DELETED:      'cms:page:deleted',

  MEDIA_UPLOADED:    'cms:media:uploaded',
  MEDIA_DELETED:     'cms:media:deleted',

  USER_REGISTERED:   'cms:user:registered',
  USER_LOGGED_IN:    'cms:user:loggedIn',

  COMMENT_CREATED:   'cms:comment:created',
  COMMENT_APPROVED:  'cms:comment:approved',

  BACKUP_COMPLETED:  'cms:backup:completed',
  SETTING_UPDATED:   'cms:setting:updated',
  FEATURE_TOGGLED:   'cms:feature:toggled',
};

module.exports = { eventBus, CMS_EVENTS };
