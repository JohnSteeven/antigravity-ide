"use strict";

const crypto = require("crypto");
const config = require("./config");

const METRIC_NAMES = new Set([
  "agent_requests_total",
  "agent_request_duration",
  "provider_requests",
  "provider_failures",
  "provider_timeouts",
  "tool_executions",
  "tool_failures",
  "permission_denials",
  "confirmation_requests",
  "rate_limit_rejections",
  "active_agent_requests",
]);

const SAFE_LOG_FIELDS = new Set([
  "requestId", "conversationId", "userHash", "provider", "model", "latencyMs",
  "tool", "toolVersion", "state", "code", "retryable", "timeoutMs", "inputTokens",
  "outputTokens", "totalTokens", "attempt", "operation", "activeRequests",
]);

const safeLabelValue = (value) => String(value ?? "unknown").replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 80);

const metricKey = (name, labels = {}) => {
  const normalized = Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${safeLabelValue(key)}=${safeLabelValue(value)}`)
    .join(",");
  return normalized ? `${name}{${normalized}}` : name;
};

class AgentMetrics {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.timings = new Map();
  }

  increment(name, labels = {}, amount = 1) {
    if (!METRIC_NAMES.has(name)) return;
    const key = metricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + Number(amount || 0));
  }

  gauge(name, value, labels = {}) {
    if (!METRIC_NAMES.has(name)) return;
    this.gauges.set(metricKey(name, labels), Number(value || 0));
  }

  observe(name, valueMs, labels = {}) {
    if (!METRIC_NAMES.has(name)) return;
    const key = metricKey(name, labels);
    const current = this.timings.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    const value = Math.max(0, Number(valueMs || 0));
    current.count += 1;
    current.totalMs += value;
    current.maxMs = Math.max(current.maxMs, value);
    this.timings.set(key, current);
  }

  snapshot() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      timings: Object.fromEntries([...this.timings].map(([name, value]) => [name, {
        ...value,
        averageMs: value.count ? Math.round(value.totalMs / value.count) : 0,
      }])),
    };
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.timings.clear();
  }
}

const hashIdentifier = (value) => {
  if (!value) return undefined;
  return crypto.createHash("sha256")
    .update(`${config.telemetrySalt}:${String(value)}`)
    .digest("hex")
    .slice(0, 20);
};

const sanitizeLogFields = (fields = {}) => Object.entries(fields).reduce((result, [key, value]) => {
  if (SAFE_LOG_FIELDS.has(key) && value !== undefined && value !== null) result[key] = value;
  return result;
}, {});

const writeLog = (level, event, fields = {}) => {
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  method(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "myjourney-agent",
    event: safeLabelValue(event),
    ...sanitizeLogFields(fields),
  }));
};

const logger = Object.freeze({
  info: (event, fields) => writeLog("info", event, fields),
  warn: (event, fields) => writeLog("warn", event, fields),
  error: (event, fields) => writeLog("error", event, fields),
});

const metrics = new AgentMetrics();

module.exports = { AgentMetrics, hashIdentifier, logger, metrics, sanitizeLogFields };
