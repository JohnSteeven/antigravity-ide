"use strict";

const { redisManager } = require("../redis/redisClient");

class RedisCache {
  constructor() {
    this.redis = redisManager;
  }

  async get(key) {
    const raw = await this.redis.get(`cache:${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return raw;
    }
  }

  async set(key, value, ttlSeconds = null) {
    const serialized = JSON.stringify(value);
    const options = ttlSeconds ? { EX: Number(ttlSeconds) } : {};
    await this.redis.set(`cache:${key}`, serialized, options);
    return value;
  }

  async delete(key) {
    const count = await this.redis.del(`cache:${key}`);
    return count > 0;
  }

  async invalidatePattern(pattern) {
    if (!this.redis.client) await this.redis.connect();
    const fullPattern = this.redis.getKey(`cache:${pattern}`);
    const keys = typeof this.redis.client.keys === "function"
      ? await this.redis.client.keys(fullPattern)
      : [];
    let count = 0;
    for (const k of keys) {
      // keys returned already include prefix
      const stripped = k.startsWith(this.redis.prefix) ? k.slice(this.redis.prefix.length) : k;
      await this.redis.del(stripped);
      count++;
    }
    return count;
  }

  async flush() {
    if (!this.redis.client) await this.redis.connect();
    if (typeof this.redis.client.flushAll === "function") {
      await this.redis.client.flushAll();
    }
  }

  async health() {
    const redisHealth = this.redis.getHealth();
    return {
      status: redisHealth.status === "ready" ? "green" : "red",
      driver: "redis",
      redisHealth,
    };
  }
}

module.exports = RedisCache;
