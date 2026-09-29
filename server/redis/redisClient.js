"use strict";

const env = require("../config/env");

class RedisError extends Error {
  constructor(message, code = "REDIS_ERROR", status = 500) {
    super(message);
    this.name = "RedisError";
    this.code = code;
    this.status = status;
  }
}

/**
 * In-memory Redis simulation for tests and local development when Redis is not running
 */
class MemoryRedisAdapter {
  constructor() {
    this._store = new Map();
    this._expirations = new Map();
    this.isOpen = true;
    this.isReady = true;
  }

  async connect() {
    this.isOpen = true;
    this.isReady = true;
    return this;
  }

  async quit() {
    this.isOpen = false;
    this.isReady = false;
    this._store.clear();
    this._expirations.forEach(clearTimeout);
    this._expirations.clear();
  }

  async disconnect() {
    return this.quit();
  }

  async ping() {
    return "PONG";
  }

  async get(key) {
    const exp = this._expirations.get(key);
    if (exp && Date.now() > exp) {
      this.del(key);
      return null;
    }
    const val = this._store.get(key);
    return val !== undefined ? String(val) : null;
  }

  async set(key, value, options = {}) {
    this._store.set(key, String(value));
    if (options.EX) {
      const ms = options.EX * 1000;
      this._expirations.set(key, Date.now() + ms);
    } else if (options.PX) {
      this._expirations.set(key, Date.now() + options.PX);
    }
    return "OK";
  }

  async del(key) {
    const deleted = this._store.delete(key);
    this._expirations.delete(key);
    return deleted ? 1 : 0;
  }

  async exists(key) {
    return this._store.has(key) ? 1 : 0;
  }

  async keys(pattern) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return Array.from(this._store.keys()).filter((k) => regex.test(k));
  }

  async flushAll() {
    this._store.clear();
    this._expirations.clear();
    return "OK";
  }
}

/**
 * Canonical Redis Client Manager
 */
class RedisClientManager {
  constructor() {
    this.client = null;
    this.status = "disconnected"; // 'disconnected' | 'connecting' | 'ready' | 'error' | 'closed'
    this.prefix = "myjourney:";
    this.lastError = null;
    this.useMemoryAdapter = false;
  }

  getKey(key) {
    return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
  }

  isConfigured() {
    return Boolean(env.redisUrl || process.env.REDIS_URL);
  }

  isRequired() {
    return Boolean(
      process.env.REQUIRE_REDIS === "true" ||
      env.multiplayer?.requireRedis === true ||
      process.env.CACHE_DRIVER === "redis" ||
      process.env.QUEUE_DRIVER === "redis"
    );
  }

  async connect(options = {}) {
    if (this.status === "ready" && this.client) {
      return this.client;
    }

    const redisUrl = options.url || env.redisUrl || process.env.REDIS_URL;

    // In test environment or when Redis is not configured in non-production
    if (!redisUrl) {
      if (this.isRequired() && process.env.NODE_ENV === "production") {
        this.status = "error";
        const err = new RedisError("Redis is required in production but REDIS_URL is not configured.", "REDIS_UNAVAILABLE", 503);
        this.lastError = err;
        throw err;
      }

      this.useMemoryAdapter = true;
      this.client = new MemoryRedisAdapter();
      this.status = "ready";
      return this.client;
    }

    try {
      const { createClient } = require("redis");
      this.status = "connecting";

      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: options.timeoutMs || 5000,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              return new Error("Redis reconnection limit reached");
            }
            return Math.min(retries * 200, 2000);
          },
        },
      });

      client.on("error", (err) => {
        this.status = "error";
        this.lastError = err.message;
        console.warn("[Redis] Connection error:", err.message);
      });

      client.on("ready", () => {
        this.status = "ready";
        this.lastError = null;
      });

      client.on("end", () => {
        this.status = "closed";
      });

      await client.connect();
      this.client = client;
      this.status = "ready";
      this.useMemoryAdapter = false;
      return this.client;
    } catch (err) {
      this.status = "error";
      this.lastError = err.message;

      if (this.isRequired()) {
        const error = new RedisError("Redis connection failed and is required.", "REDIS_CONNECTION_FAILED", 503);
        throw error;
      }

      console.warn("[Redis] Failed to connect, falling back to local memory adapter:", err.message);
      this.useMemoryAdapter = true;
      this.client = new MemoryRedisAdapter();
      this.status = "ready";
      return this.client;
    }
  }

  async get(key) {
    if (!this.client || this.status !== "ready") await this.connect();
    return this.client.get(this.getKey(key));
  }

  async set(key, value, options) {
    if (!this.client || this.status !== "ready") await this.connect();
    return this.client.set(this.getKey(key), value, options);
  }

  async del(key) {
    if (!this.client || this.status !== "ready") await this.connect();
    return this.client.del(this.getKey(key));
  }

  async exists(key) {
    if (!this.client || this.status !== "ready") await this.connect();
    return this.client.exists(this.getKey(key));
  }

  async disconnect() {
    if (this.client) {
      try {
        if (typeof this.client.quit === "function") {
          await this.client.quit();
        } else if (typeof this.client.disconnect === "function") {
          await this.client.disconnect();
        }
      } catch (_e) {
        // ignore disconnect errors during shutdown
      }
      this.client = null;
      this.status = "closed";
    }
  }

  getHealth() {
    return {
      status: this.status === "ready" ? "ready" : (this.isRequired() ? "unavailable" : "disabled"),
      driver: this.useMemoryAdapter ? "memory" : "redis",
      configured: this.isConfigured(),
      required: this.isRequired(),
      error: this.lastError,
    };
  }
}

const redisManager = new RedisClientManager();

module.exports = {
  RedisError,
  MemoryRedisAdapter,
  RedisClientManager,
  redisManager,
};
