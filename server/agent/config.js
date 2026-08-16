"use strict";

const { PROVIDER_KEYS } = require("./constants");

const integerFromEnv = (name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(process.env[name], 10);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(max, Math.max(min, value));
};

const booleanFromEnv = (name, fallback) => {
  if (process.env[name] === undefined) return fallback;
  return String(process.env[name]).toLowerCase() === "true";
};

const nodeEnv = process.env.NODE_ENV || "development";
const configuredProvider = String(
  process.env.AGENT_PROVIDER || (nodeEnv === "production" ? "" : PROVIDER_KEYS.MOCK)
).trim().toLowerCase();

// Agent configuration is intentionally server-only. In particular, local model
// endpoints and future provider credentials must never be serialized to clients.
const agentConfig = Object.freeze({
  enabled: booleanFromEnv("AGENT_ENABLED", true),
  provider: configuredProvider,
  providerTimeoutMs: integerFromEnv("AGENT_PROVIDER_TIMEOUT_MS", 15000, { min: 500, max: 120000 }),
  providerRetries: integerFromEnv("AGENT_PROVIDER_RETRIES", 1, { min: 0, max: 2 }),
  providerHealthCacheMs: integerFromEnv("AGENT_PROVIDER_HEALTH_CACHE_MS", 10000, { min: 250, max: 300000 }),
  circuitFailureThreshold: integerFromEnv("AGENT_PROVIDER_CIRCUIT_FAILURE_THRESHOLD", 3, { min: 1, max: 20 }),
  circuitResetMs: integerFromEnv("AGENT_PROVIDER_CIRCUIT_RESET_MS", 30000, { min: 1000, max: 600000 }),
  local: Object.freeze({
    endpoint: String(process.env.AGENT_LOCAL_ENDPOINT || "").trim(),
    healthEndpoint: String(process.env.AGENT_LOCAL_HEALTH_ENDPOINT || "").trim(),
    model: String(process.env.AGENT_LOCAL_MODEL || "local-model").trim(),
    apiKey: String(process.env.AGENT_LOCAL_API_KEY || "").trim(),
  }),
  limits: Object.freeze({
    messageChars: integerFromEnv("AGENT_MESSAGE_MAX_CHARS", 4000, { min: 256, max: 20000 }),
    assistantChars: integerFromEnv("AGENT_ASSISTANT_MAX_CHARS", 16000, { min: 512, max: 50000 }),
    contextMessages: integerFromEnv("AGENT_CONTEXT_MAX_MESSAGES", 12, { min: 2, max: 50 }),
    contextChars: integerFromEnv("AGENT_CONTEXT_MAX_CHARS", 24000, { min: 2000, max: 100000 }),
    toolOutputChars: integerFromEnv("AGENT_TOOL_OUTPUT_MAX_CHARS", 12000, { min: 512, max: 50000 }),
    toolCallsPerTurn: integerFromEnv("AGENT_TOOL_CALLS_PER_TURN", 5, { min: 1, max: 12 }),
    toolIterations: integerFromEnv("AGENT_TOOL_ITERATIONS", 3, { min: 1, max: 6 }),
    conversationsPage: integerFromEnv("AGENT_CONVERSATIONS_PAGE_SIZE", 20, { min: 1, max: 50 }),
    messagesPage: integerFromEnv("AGENT_MESSAGES_PAGE_SIZE", 50, { min: 1, max: 100 }),
    requestsPerWindow: integerFromEnv("AGENT_RATE_LIMIT_MAX", nodeEnv === "production" ? 30 : 120, { min: 1, max: 10000 }),
    rateWindowMs: integerFromEnv("AGENT_RATE_LIMIT_WINDOW_MS", 60000, { min: 1000, max: 3600000 }),
    concurrentRequestsPerUser: integerFromEnv("AGENT_CONCURRENCY_PER_USER", 2, { min: 1, max: 10 }),
  }),
  retention: Object.freeze({
    conversationDays: integerFromEnv("AGENT_CONVERSATION_RETENTION_DAYS", 30, { min: 1, max: 365 }),
    archivedConversationDays: integerFromEnv("AGENT_ARCHIVED_RETENTION_DAYS", 14, { min: 1, max: 365 }),
    toolAuditDays: integerFromEnv("AGENT_TOOL_AUDIT_RETENTION_DAYS", 90, { min: 1, max: 730 }),
  }),
  confirmation: Object.freeze({
    ttlSeconds: integerFromEnv("AGENT_CONFIRMATION_TTL_SECONDS", 300, { min: 30, max: 900 }),
  }),
  telemetrySalt: String(process.env.AGENT_TELEMETRY_SALT || "myjourney-agent").trim(),
  booleanFromEnv,
  integerFromEnv,
});

module.exports = agentConfig;
