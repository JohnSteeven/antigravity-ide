"use strict";

/**
 * LocalAgentProvider
 *
 * Calls a local model endpoint (e.g., Ollama running llama3, mistral, etc.)
 * using an OpenAI-compatible chat completions API.
 *
 * Configuration (all optional):
 *   AGENT_LOCAL_ENDPOINT         — e.g. http://localhost:11434/v1
 *   AGENT_LOCAL_HEALTH_ENDPOINT  — e.g. http://localhost:11434/api/tags
 *   AGENT_LOCAL_MODEL            — model name, e.g. "llama3"
 *   AGENT_LOCAL_API_KEY          — API key if the local endpoint requires one
 *
 * If the endpoint is not configured or the health check fails, the provider
 * reports itself as unavailable and the AgentProviderRegistry falls back to
 * the mock provider (development) or returns a controlled error (production).
 *
 * Normal MyJourney startup does NOT require a local model to be running.
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");
const agentConfig = require("../config");
const { AgentError, errorCodes } = require("../errors");
const { PROVIDER_KEYS } = require("../constants");

const PROVIDER_KEY = PROVIDER_KEYS.LOCAL;
const DEFAULT_TIMEOUT_MS = agentConfig.providerTimeoutMs || 30000;

const makeRequest = (urlString, { method = "POST", headers = {}, body = null, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) =>
  new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch (_parseError) {
      return reject(new AgentError(errorCodes.PROVIDER_UNAVAILABLE, "Local provider endpoint URL is invalid.", 503));
    }

    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    const requestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
    };

    const req = lib.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_parseError) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (error) => reject(
      new AgentError(errorCodes.PROVIDER_UNAVAILABLE, `Local provider connection failed: ${error.message}`, 503, null, true)
    ));

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new AgentError(errorCodes.TIMEOUT, "Local provider request timed out.", 504, null, true));
    });

    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });

const buildSystemPrompt = () =>
  `You are MyJourney, a helpful AI assistant. You have access to real authenticated user data through registered tools.
Always use the provided tools to get accurate user data. Never fabricate personal information.
When using tools, include them in your response as JSON in this format:
<tool_call>{"tool":"tool.name","input":{}}</tool_call>
After receiving tool results, provide a helpful response based on the actual data.`;

const buildMessages = (userMessage, contextMessages, toolResults = []) => {
  const messages = [{ role: "system", content: buildSystemPrompt() }];

  for (const msg of contextMessages.slice(-agentConfig.limits.contextMessages)) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: String(msg.content || "").slice(0, 2000) });
    }
  }

  // Inject tool results as context if available
  if (toolResults.length > 0) {
    const toolContext = toolResults
      .map(({ toolKey, output }) => `[${toolKey}]: ${JSON.stringify(output).slice(0, 500)}`)
      .join("\n");
    messages.push({
      role: "user",
      content: `${userMessage}\n\n[Tool results available]:\n${toolContext}`,
    });
  } else {
    messages.push({ role: "user", content: userMessage });
  }

  return messages;
};

const extractToolCalls = (content) => {
  const calls = [];
  const regex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.tool && typeof parsed.tool === "string") {
        calls.push({ toolKey: parsed.tool, input: parsed.input || {} });
      }
    } catch (_parseError) {
      // Ignore malformed tool calls
    }
  }
  return calls;
};

const stripToolCalls = (content) => content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "").trim();

class LocalAgentProvider {
  constructor() {
    this._lastHealthCheck = null;
    this._lastHealthResult = null;
  }

  get key() {
    return PROVIDER_KEY;
  }

  get model() {
    return agentConfig.local.model;
  }

  _isConfigured() {
    return Boolean(agentConfig.local.endpoint);
  }

  async health() {
    if (!this._isConfigured()) {
      return { available: false, provider: PROVIDER_KEY, reason: "endpoint_not_configured" };
    }

    const now = Date.now();
    if (this._lastHealthCheck && (now - this._lastHealthCheck) < agentConfig.providerHealthCacheMs) {
      return this._lastHealthResult;
    }

    let result;
    try {
      const healthUrl = agentConfig.local.healthEndpoint || `${agentConfig.local.endpoint}/models`;
      const start = Date.now();
      const response = await makeRequest(healthUrl, { method: "GET", timeoutMs: 5000 });
      const latencyMs = Date.now() - start;
      result = {
        available: response.status >= 200 && response.status < 300,
        provider: PROVIDER_KEY,
        model: agentConfig.local.model,
        latencyMs,
      };
    } catch (_error) {
      result = { available: false, provider: PROVIDER_KEY, reason: "health_check_failed" };
    }

    this._lastHealthCheck = now;
    this._lastHealthResult = result;
    return result;
  }

  isAvailable() {
    if (!this._isConfigured()) return false;
    if (this._lastHealthResult) return Boolean(this._lastHealthResult.available);
    return true; // Optimistic until health check runs
  }

  /**
   * Execute one Agent turn using the configured local model endpoint.
   * Supports a simple tool-calling loop (model requests tools, server executes, results fed back).
   */
  async turn({ userMessage, contextMessages = [], executeTool, toolContext }) {
    if (!this._isConfigured()) {
      throw new AgentError(
        errorCodes.PROVIDER_UNAVAILABLE,
        "The local AI provider is not configured. Set AGENT_LOCAL_ENDPOINT to enable it.",
        503,
        { provider: PROVIDER_KEY }
      );
    }

    const health = await this.health();
    if (!health.available) {
      throw new AgentError(
        errorCodes.PROVIDER_UNAVAILABLE,
        "The local AI provider is currently unavailable.",
        503,
        { provider: PROVIDER_KEY },
        true
      );
    }

    const chatUrl = `${agentConfig.local.endpoint}/chat/completions`;
    const headers = agentConfig.local.apiKey ? { Authorization: `Bearer ${agentConfig.local.apiKey}` } : {};

    let toolResultsCollected = [];
    let allToolCalls = [];
    let iterations = 0;

    // First pass: ask model if it needs tools
    let messages = buildMessages(userMessage, contextMessages);
    let responseContent = "";

    while (iterations < agentConfig.limits.toolIterations) {
      iterations += 1;
      const start = Date.now();

      let response;
      try {
        response = await makeRequest(chatUrl, {
          method: "POST",
          headers,
          body: {
            model: agentConfig.local.model,
            messages,
            max_tokens: Math.ceil(agentConfig.limits.assistantChars / 3),
            temperature: 0.3,
          },
          timeoutMs: agentConfig.providerTimeoutMs,
        });
      } catch (error) {
        if (error instanceof AgentError) throw error;
        throw new AgentError(errorCodes.PROVIDER_UNAVAILABLE, "Local provider request failed.", 503, null, true);
      }

      const latencyMs = Date.now() - start;

      if (!response.body?.choices?.[0]?.message?.content) {
        throw new AgentError(errorCodes.PROVIDER_RESPONSE_INVALID, "Local provider returned an unexpected response.", 502);
      }

      responseContent = String(response.body.choices[0].message.content);
      const requestedTools = extractToolCalls(responseContent);

      if (requestedTools.length === 0) break; // No more tool calls — we have the final answer

      // Execute requested tools (bounded)
      const batch = requestedTools.slice(0, agentConfig.limits.toolCallsPerTurn - allToolCalls.length);
      for (const { toolKey, input } of batch) {
        if (allToolCalls.length >= agentConfig.limits.toolCallsPerTurn) break;
        try {
          const result = await executeTool(toolKey, input, toolContext);
          allToolCalls.push({ toolKey, input, status: "succeeded", latencyMs });
          toolResultsCollected.push({ toolKey, output: result.output });
        } catch (toolError) {
          allToolCalls.push({ toolKey, input, status: "failed", error: toolError?.code });
          if (toolError?.code === errorCodes.AUTH_REQUIRED || toolError?.code === errorCodes.ENTITLEMENT_REQUIRED) {
            throw toolError;
          }
        }
      }

      // Feed tool results back into next iteration
      messages = buildMessages(userMessage, contextMessages, toolResultsCollected);
    }

    const finalContent = stripToolCalls(responseContent).slice(0, agentConfig.limits.assistantChars);
    const usage = response?.body?.usage || {};

    return {
      content: finalContent,
      toolCalls: allToolCalls,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    };
  }
}

module.exports = { LocalAgentProvider };
