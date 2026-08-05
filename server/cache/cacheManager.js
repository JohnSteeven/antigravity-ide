/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  cacheManager.js  —  Abstract Cache Interface
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Reads CACHE_DRIVER env to select the appropriate cache backend.
 *  Default: MemoryCache (no external dependencies)
 *  Optional: RedisCache (set CACHE_DRIVER=redis + REDIS_URL)
 *
 *  Usage in controllers:
 *    const cache = require('../cache/cacheManager');
 *
 *    // Get with fallback:
 *    let articles = await cache.get('articles:page:1');
 *    if (!articles) {
 *      articles = await Article.find(...);
 *      await cache.set('articles:page:1', articles, 300); // 300s TTL
 *    }
 *
 *    // Invalidate on write:
 *    await cache.invalidatePattern('articles:*');
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const config = require('../config/configRegistry');

class MemoryCache {
  constructor() {
    this._store = new Map();
    this._timers = new Map();
  }

  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = null) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this._store.set(key, { value, expiresAt });

    // Auto-cleanup timer
    if (ttlSeconds) {
      if (this._timers.has(key)) clearTimeout(this._timers.get(key));
      this._timers.set(key, setTimeout(() => this._store.delete(key), ttlSeconds * 1000));
    }

    return value;
  }

  async delete(key) {
    if (this._timers.has(key)) clearTimeout(this._timers.get(key));
    return this._store.delete(key);
  }

  async invalidatePattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;
    for (const key of this._store.keys()) {
      if (regex.test(key)) {
        this._store.delete(key);
        count++;
      }
    }
    return count;
  }

  async flush() {
    this._store.clear();
    this._timers.forEach(clearTimeout);
    this._timers.clear();
  }

  async health() {
    return { status: 'green', driver: 'memory', keys: this._store.size };
  }
}

// ── Cache Manager (with lazy driver loading) ──────────────────────────────────

let _instance = null;

function createCache() {
  const driver = config.get('cache.driver', 'memory');

  switch (driver) {
    case 'redis': {
      try {
        const RedisCache = require('./RedisCache');
        console.info('[Cache] Using Redis cache driver');
        return new RedisCache();
      } catch (err) {
        console.warn('[Cache] Redis driver unavailable — falling back to memory:', err.message);
        return new MemoryCache();
      }
    }

    case 'null':
    case 'none':
      return {
        get: async () => null,
        set: async (k, v) => v,
        delete: async () => false,
        invalidatePattern: async () => 0,
        flush: async () => {},
        health: async () => ({ status: 'green', driver: 'null' }),
      };

    case 'memory':
    default:
      console.info('[Cache] Using in-memory cache driver');
      return new MemoryCache();
  }
}

// ── Singleton Cache Instance ──────────────────────────────────────────────────

const cache = {
  get instance() {
    if (!_instance) _instance = createCache();
    return _instance;
  },

  async get(key)                     { return this.instance.get(key); },
  async set(key, value, ttl = null)  { return this.instance.set(key, value, ttl); },
  async delete(key)                  { return this.instance.delete(key); },
  async invalidatePattern(pattern)   { return this.instance.invalidatePattern(pattern); },
  async flush()                      { return this.instance.flush(); },
  async health()                     { return this.instance.health(); },

  /** Get-or-set: fetch from cache, or compute and store. */
  async remember(key, ttl, fetchFn) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  },
};

module.exports = cache;
