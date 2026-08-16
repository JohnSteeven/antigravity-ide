"use strict";

const config = require("./config");
const { AgentError, errorCodes } = require("./errors");
const { metrics } = require("./observability");

class LocalRateLimiter {
  constructor({ windowMs = config.limits.rateWindowMs, max = config.limits.requestsPerWindow, maxKeys = 10000 } = {}) {
    this.windowMs = windowMs;
    this.max = max;
    this.maxKeys = maxKeys;
    this.windows = new Map();
  }

  consume(key, { cost = 1, now = Date.now() } = {}) {
    if (!key) throw new AgentError(errorCodes.REQUEST_INVALID, "A rate-limit identity is required.", 422);
    const current = this.windows.get(String(key));
    const window = !current || current.resetAt <= now
      ? { used: 0, resetAt: now + this.windowMs }
      : current;

    if (window.used + cost > this.max) {
      const retryAfterMs = Math.max(1, window.resetAt - now);
      metrics.increment("rate_limit_rejections", { scope: "local" });
      throw new AgentError(
        errorCodes.RATE_LIMITED,
        "Too many Agent requests. Please wait before trying again.",
        429,
        { retryAfterMs },
        true
      );
    }

    window.used += cost;
    this.windows.set(String(key), window);
    this.prune(now);
    return { allowed: true, remaining: Math.max(0, this.max - window.used), resetAt: new Date(window.resetAt) };
  }

  prune(now = Date.now()) {
    for (const [key, value] of this.windows) {
      if (value.resetAt <= now) this.windows.delete(key);
    }
    while (this.windows.size > this.maxKeys) {
      this.windows.delete(this.windows.keys().next().value);
    }
  }

  reset(key = null) {
    if (key === null) this.windows.clear();
    else this.windows.delete(String(key));
  }

  health() {
    return { backend: "local", distributed: false, trackedKeys: this.windows.size, windowMs: this.windowMs, max: this.max };
  }
}

class LocalConcurrencyLimiter {
  constructor({ max = config.limits.concurrentRequestsPerUser, maxKeys = 10000 } = {}) {
    this.max = max;
    this.maxKeys = maxKeys;
    this.active = new Map();
  }

  acquire(key) {
    if (!key) throw new AgentError(errorCodes.REQUEST_INVALID, "A concurrency identity is required.", 422);
    const normalizedKey = String(key);
    const current = this.active.get(normalizedKey) || 0;
    if (current >= this.max) {
      throw new AgentError(
        errorCodes.CONCURRENCY_LIMIT,
        "Another Agent request is already in progress. Please wait for it to finish.",
        429,
        { maxConcurrent: this.max },
        true
      );
    }
    if (!this.active.has(normalizedKey) && this.active.size >= this.maxKeys) {
      throw new AgentError(errorCodes.CONCURRENCY_LIMIT, "Agent request capacity is temporarily full.", 503, undefined, true);
    }

    this.active.set(normalizedKey, current + 1);
    metrics.gauge("active_agent_requests", this.totalActive());
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const remaining = (this.active.get(normalizedKey) || 1) - 1;
      if (remaining <= 0) this.active.delete(normalizedKey);
      else this.active.set(normalizedKey, remaining);
      metrics.gauge("active_agent_requests", this.totalActive());
    };
  }

  async run(key, operation) {
    const release = this.acquire(key);
    try {
      return await operation();
    } finally {
      release();
    }
  }

  totalActive() {
    return [...this.active.values()].reduce((sum, value) => sum + value, 0);
  }

  reset() {
    this.active.clear();
    metrics.gauge("active_agent_requests", 0);
  }

  health() {
    return { backend: "local", distributed: false, trackedKeys: this.active.size, active: this.totalActive(), maxPerKey: this.max };
  }
}

const requestRateLimiter = new LocalRateLimiter();
const userConcurrencyLimiter = new LocalConcurrencyLimiter();

module.exports = {
  LocalConcurrencyLimiter,
  LocalRateLimiter,
  requestRateLimiter,
  userConcurrencyLimiter,
};
