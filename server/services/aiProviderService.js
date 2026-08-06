/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  aiProviderService.js  —  Multi-Provider AI Abstraction Layer
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single abstraction that routes all AI calls through the configured provider.
 *  Switching providers requires zero code changes — only a DB config update.
 *
 *  Supported providers:
 *    - OpenAI   (gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
 *    - Gemini   (gemini-1.5-pro, gemini-1.5-flash)
 *    - Claude   (claude-3-5-sonnet, claude-3-haiku)
 *    - Ollama   (llama3, mistral, phi3 — any locally hosted model)
 *
 *  Zero external dependencies required at install time.
 *  Provider SDKs are called via raw fetch to avoid forced installs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AIProvider = require('../models/AIProvider');
const AIUsageLog = require('../models/AIUsageLog');

// ─── Provider Adapters ────────────────────────────────────────────────────────

/**
 * OpenAI Chat Completions API
 */
async function callOpenAI(config, messages) {
  const url = config.baseUrl || 'https://api.openai.com/v1/chat/completions';
  const model = config.model || 'gpt-4o';

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048,
      }),
    },
    config.timeoutMs || 30000
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI error ${response.status}`);
  }

  return {
    content: data.choices?.[0]?.message?.content || '',
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
    totalTokens: data.usage?.total_tokens || 0,
    model,
  };
}

/**
 * Google Gemini API (v1beta)
 */
async function callGemini(config, messages) {
  const model = config.model || 'gemini-1.5-flash';
  const url =
    config.baseUrl ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  // Convert OpenAI message format → Gemini parts format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Inject system prompt as first user message if present
  const systemMsg = messages.find((m) => m.role === 'system');
  if (systemMsg) {
    contents.unshift({ role: 'user', parts: [{ text: systemMsg.content }] });
    contents.splice(1, 0, { role: 'model', parts: [{ text: 'Understood.' }] });
  }

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 2048,
        },
      }),
    },
    config.timeoutMs || 30000
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini error ${response.status}`);
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const inputTokens = data.usageMetadata?.promptTokenCount || 0;
  const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

  return { content, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, model };
}

/**
 * Anthropic Claude API (Messages API v1)
 */
async function callClaude(config, messages) {
  const url = config.baseUrl || 'https://api.anthropic.com/v1/messages';
  const model = config.model || 'claude-3-5-sonnet-20241022';

  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
  const chatMessages = messages.filter((m) => m.role !== 'system');

  const body = {
    model,
    messages: chatMessages,
    max_tokens: config.maxTokens ?? 2048,
    temperature: config.temperature ?? 0.7,
  };
  if (systemMsg) body.system = systemMsg;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    },
    config.timeoutMs || 30000
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Claude error ${response.status}`);
  }

  const content = data.content?.[0]?.text || '';
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;

  return { content, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, model };
}

/**
 * Ollama Local API (OpenAI-compatible)
 */
async function callOllama(config, messages) {
  const url = `${config.baseUrl || 'http://localhost:11434'}/api/chat`;
  const model = config.model || 'llama3';

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        options: {
          temperature: config.temperature ?? 0.7,
          num_predict: config.maxTokens ?? 2048,
        },
        stream: false,
      }),
    },
    config.timeoutMs || 60000 // Ollama can be slower
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Ollama error ${response.status}`);
  }

  const content = data.message?.content || '';
  // Ollama doesn't always return token counts
  const inputTokens = data.prompt_eval_count || 0;
  const outputTokens = data.eval_count || 0;

  return { content, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, model };
}

// ─── Core Provider Dispatcher ────────────────────────────────────────────────

const ADAPTERS = {
  openai: callOpenAI,
  gemini: callGemini,
  claude: callClaude,
  ollama: callOllama,
};

class AIProviderService {
  /**
   * Fetch the active provider config from the database (with API key).
   * Returns null if no provider is configured and enabled.
   */
  static async getActiveConfig() {
    const provider = await AIProvider.findOne({ isActive: true, isEnabled: true })
      .select('+apiKey')
      .lean();
    return provider || null;
  }

  /**
   * Check if AI is available (provider configured + enabled).
   */
  static async isAvailable() {
    const config = await AIProviderService.getActiveConfig();
    return !!config;
  }

  /**
   * Core inference method — call the active AI provider.
   *
   * @param {object} options
   * @param {Array}  options.messages   - OpenAI message format: [{role, content}]
   * @param {string} options.action     - For usage logging (e.g. 'generate', 'rewrite')
   * @param {string} options.source     - Where the call originated ('cms-writer', 'api', etc.)
   * @param {string} [options.userId]   - For usage logging
   * @param {string} [options.articleId]- For usage logging
   * @param {string} [options.templateKey] - Prompt template key used
   * @param {object} [options.overrides]   - Override temperature/maxTokens per call
   * @returns {Promise<{content: string, tokens: object, latencyMs: number, provider: string}>}
   */
  static async complete(options) {
    const {
      messages,
      action = 'generate',
      source = 'cms-writer',
      userId = null,
      articleId = null,
      templateKey = null,
      overrides = {},
    } = options;

    const config = await AIProviderService.getActiveConfig();
    if (!config || !config.apiKey) {
      const err = new Error('AI Completions Unavailable. No active AI provider configured with a valid API key.');
      err.status = 503;
      throw err;
    }

    // Check daily/monthly limits
    if (config.dailyTokenLimit > 0 && config.dailyTokensUsed >= config.dailyTokenLimit) {
      throw new Error(`Daily AI token limit (${config.dailyTokenLimit.toLocaleString()}) reached. Limit resets at midnight.`);
    }
    if (config.monthlyTokenLimit > 0 && config.monthlyTokensUsed >= config.monthlyTokenLimit) {
      throw new Error(`Monthly AI token limit reached. Contact your administrator.`);
    }

    const adapter = ADAPTERS[config.provider];
    if (!adapter) {
      throw new Error(`Unsupported AI provider: "${config.provider}"`);
    }

    // Merge config with per-call overrides
    const effectiveConfig = { ...config, ...overrides };

    const startTime = Date.now();
    let result;
    let success = true;
    let errorMessage = null;

    try {
      result = await retryWithBackoff(
        () => adapter(effectiveConfig, messages),
        config.retryCount || 2
      );
    } catch (err) {
      success = false;
      errorMessage = err.message;
      throw err;
    } finally {
      const latencyMs = Date.now() - startTime;
      const tokenCount = result?.totalTokens || 0;

      // Estimate cost
      const inputCost = ((result?.inputTokens || 0) / 1000) * (config.costPerInputToken || 0);
      const outputCost = ((result?.outputTokens || 0) / 1000) * (config.costPerOutputToken || 0);
      const estimatedCostUsd = inputCost + outputCost;

      // Log usage asynchronously — don't await, don't block the response
      AIUsageLog.create({
        provider: config.provider,
        model: result?.model || config.model,
        action,
        userId,
        articleId,
        templateKey,
        inputTokens: result?.inputTokens || 0,
        outputTokens: result?.outputTokens || 0,
        totalTokens: tokenCount,
        estimatedCostUsd,
        latencyMs,
        success,
        errorMessage,
        source,
      }).catch((logErr) => console.error('[AIProviderService] Usage log error:', logErr.message));

      // Update provider counters asynchronously
      if (tokenCount > 0) {
        AIProvider.findByIdAndUpdate(config._id, {
          $inc: {
            dailyTokensUsed: tokenCount,
            monthlyTokensUsed: tokenCount,
            totalTokensUsed: tokenCount,
            estimatedTotalCostUsd: estimatedCostUsd,
          },
        }).catch(() => {});
      }
    }

    return {
      content: result.content,
      tokens: {
        input: result.inputTokens,
        output: result.outputTokens,
        total: result.totalTokens,
      },
      latencyMs: Date.now() - startTime,
      provider: config.provider,
      model: result.model,
    };
  }

  /**
   * Test a provider connection — returns success/failure without logging usage.
   */
  static async testConnection(providerConfig) {
    const adapter = ADAPTERS[providerConfig.provider];
    if (!adapter) throw new Error(`Unknown provider: ${providerConfig.provider}`);

    try {
      const result = await adapter(providerConfig, [
        { role: 'user', content: 'Say "Connection OK" and nothing else.' },
      ]);
      return { success: true, response: result.content?.slice(0, 100) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Seed built-in provider entries if the collection is empty.
   */
  static async seedDefaults() {
    try {
      const count = await AIProvider.countDocuments();
      if (count === 0) {
        await AIProvider.create({
          name: 'OpenAI GPT-4o (Configure API Key)',
          provider: 'openai',
          model: 'gpt-4o',
          isActive: false,
          isEnabled: false,
          temperature: 0.7,
          maxTokens: 2048,
          notes: 'Add your OpenAI API key to enable. Get one at https://platform.openai.com/',
        });
        console.info('[AIProviderService] Seeded default provider placeholder.');
      }
    } catch (err) {
      console.error('[AIProviderService] Seed error:', err.message);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`AI request timed out after ${timeoutMs}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function retryWithBackoff(fn, retries = 2, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Don't retry on auth errors or prompt violations
      if (err.message?.includes('401') || err.message?.includes('403')) throw err;
      if (i < retries) await sleep(delayMs * Math.pow(2, i));
    }
  }
  throw lastErr;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = AIProviderService;
