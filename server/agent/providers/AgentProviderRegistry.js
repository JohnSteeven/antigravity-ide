"use strict";

/**
 * AgentProviderRegistry
 *
 * Selects and manages Agent providers based on configuration.
 * Implements a simple circuit-breaker to isolate provider failures.
 *
 * Provider priority (by configured AGENT_PROVIDER env var):
 *   "mock"  → MockAgentProvider  (development default, no external API)
 *   "local" → LocalAgentProvider (local model, e.g. Ollama)
 *   ""      → production: returns controlled unavailable error
 *
 * The registry never crashes MyJourney startup — provider unavailability
 * is a controlled state, not an exception.
 */

const agentConfig = require("../config");
const { PROVIDER_KEYS } = require("../constants");
const { AgentError, errorCodes } = require("../errors");
const { logger, metrics } = require("../observability");
const { MockAgentProvider } = require("./MockAgentProvider");
const { LocalAgentProvider } = require("./LocalAgentProvider");

const nodeEnv = process.env.NODE_ENV || "development";

class CircuitBreaker {
  constructor({ failureThreshold, resetMs }) {
    this.failureThreshold = failureThreshold;
    this.resetMs = resetMs;
    this.failures = 0;
    this.openAt = null;
  }

  get isOpen() {
    if (!this.openAt) return false;
    if (Date.now() - this.openAt >= this.resetMs) {
      // Half-open: allow one attempt
      this.openAt = null;
      this.failures = 0;
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.failures = 0;
    this.openAt = null;
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold && !this.openAt) {
      this.openAt = Date.now();
    }
  }
}

class AgentProviderRegistry {
  constructor() {
    this._providers = new Map();
    this._circuit = new Map();
    this._healthCache = new Map();
    this._initialized = false;
  }

  _init() {
    if (this._initialized) return;
    this._initialized = true;

    const mock = new MockAgentProvider();
    const local = new LocalAgentProvider();

    this._providers.set(PROVIDER_KEYS.MOCK, mock);
    this._providers.set(PROVIDER_KEYS.LOCAL, local);

    for (const key of this._providers.keys()) {
      this._circuit.set(
        key,
        new CircuitBreaker({
          failureThreshold: agentConfig.circuitFailureThreshold,
          resetMs: agentConfig.circuitResetMs,
        })
      );
    }
  }

  /**
   * Return the active provider based on configuration.
   * Throws AgentError if agent is disabled or no provider is available.
   */
  getProvider() {
    this._init();

    const configuredKey = String(agentConfig.provider || "").toLowerCase();
    let providerKey = configuredKey;

    // In development, default to mock if no provider set
    if (!providerKey && nodeEnv !== "production") {
      providerKey = PROVIDER_KEYS.MOCK;
    }

    const provider = this._providers.get(providerKey);

    if (!provider) {
      throw new AgentError(
        errorCodes.PROVIDER_UNAVAILABLE,
        "The MyJourney Agent is not configured with an active AI provider.",
        503,
        { provider: providerKey || "none" }
      );
    }

    const circuit = this._circuit.get(providerKey);
    if (circuit?.isOpen) {
      metrics.increment("provider_failures", { provider: providerKey, reason: "circuit_open" });
      throw new AgentError(
        errorCodes.PROVIDER_UNAVAILABLE,
        "The MyJourney Agent provider is temporarily unavailable. Please try again shortly.",
        503,
        { provider: providerKey },
        true
      );
    }

    return { provider, circuit, providerKey };
  }

  /**
   * Run a provider turn, recording circuit-breaker outcomes.
   */
  async runTurn(turnArgs) {
    const { provider, circuit, providerKey } = this.getProvider();
    const start = Date.now();

    try {
      const result = await provider.turn(turnArgs);
      circuit.recordSuccess();
      metrics.observe("agent_request_duration", Date.now() - start, { provider: providerKey });
      metrics.increment("provider_requests", { provider: providerKey, result: "success" });
      return { ...result, provider: providerKey, model: provider.model };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const isProviderError = error?.code === errorCodes.PROVIDER_UNAVAILABLE || error?.code === errorCodes.TIMEOUT;
      if (isProviderError) {
        circuit.recordFailure();
        metrics.increment("provider_failures", { provider: providerKey });
      }
      metrics.observe("agent_request_duration", latencyMs, { provider: providerKey });
      logger.error("provider_turn_failed", { provider: providerKey, latencyMs, code: error?.code });
      throw error instanceof AgentError ? error : AgentError.from(error);
    }
  }

  async getHealth() {
    this._init();
    const results = {};
    for (const [key, provider] of this._providers) {
      try {
        results[key] = await provider.health();
      } catch (_error) {
        results[key] = { available: false, provider: key, reason: "health_check_error" };
      }
    }
    return {
      configured: agentConfig.provider || "none",
      providers: results,
      circuits: Object.fromEntries(
        [...this._circuit.entries()].map(([key, cb]) => [key, { open: cb.isOpen, failures: cb.failures }])
      ),
    };
  }

  describe() {
    this._init();
    return [...this._providers.values()].map((p) => ({
      key: p.key,
      model: p.model,
      available: p.isAvailable(),
    }));
  }
}

// Singleton registry
const providerRegistry = new AgentProviderRegistry();

module.exports = { AgentProviderRegistry, providerRegistry };
