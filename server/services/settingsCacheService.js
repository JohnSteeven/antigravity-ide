/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  settingsCacheService.js  —  High-Performance Cache Layer for Settings
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cache = require('../cache/cacheManager');

const CACHE_PREFIX = 'cms:setting:';
const CACHE_TTL = 3600; // 1 hour TTL (invalidated on write)

class SettingsCacheService {
  static async get(key) {
    return await cache.get(`${CACHE_PREFIX}${key}`);
  }

  static async set(key, value) {
    return await cache.set(`${CACHE_PREFIX}${key}`, value, CACHE_TTL);
  }

  static async invalidate(key) {
    await cache.delete(`${CACHE_PREFIX}${key}`);
    await cache.invalidatePattern(`${CACHE_PREFIX}*`);
  }

  static async flush() {
    await cache.invalidatePattern(`${CACHE_PREFIX}*`);
  }
}

module.exports = SettingsCacheService;
