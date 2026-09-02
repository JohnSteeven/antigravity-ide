/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  cacheProviderService.js  —  Multi-Provider Distributed Cache Adapter
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

class CacheProviderService {
  constructor() {
    this.memoryStore = new Map();
    this.provider = 'memory'; // 'memory' | 'redis' | 'memcached'
    this.hits = 0;
    this.misses = 0;
  }

  async get(key) {
    if (this.memoryStore.has(key)) {
      const item = this.memoryStore.get(key);
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.memoryStore.delete(key);
        this.misses++;
        return null;
      }
      this.hits++;
      return item.value;
    }
    this.misses++;
    return null;
  }

  async set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value, expiresAt });
    return true;
  }

  async invalidate(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.memoryStore.keys()) {
      if (regex.test(key)) this.memoryStore.delete(key);
    }
    return true;
  }

  getMetrics() {
    const total = this.hits + this.misses;
    const hitRatePercent = total > 0 ? ((this.hits / total) * 100).toFixed(1) : 100;
    return {
      provider: this.provider,
      keysCount: this.memoryStore.size,
      hits: this.hits,
      misses: this.misses,
      hitRatePercent,
    };
  }
}

module.exports = new CacheProviderService();
