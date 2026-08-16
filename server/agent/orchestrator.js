"use strict";

const crypto = require("crypto");
const agentConfig = require("./config");
const { AgentError, errorCodes } = require("./errors");
const { logger, metrics, hashIdentifier } = require("./observability");
const featureFlags = require("./featureFlags");
const { registry } = require("./tools/index");
const { authorizeTool } = require("./tools/permissionService");
const { PERMISSIONS } = require("./tools/permissionService");
const { providerRegistry } = require("./providers/AgentProviderRegistry");
const conversationService = require("./conversationService");
const AgentToolExecution = require("../models/AgentToolExecution");

const MAX_TOOL_CALLS_PER_TURN = agentConfig.limits.toolCallsPerTurn;

const hashInput = (input) =>
  crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex").slice(0, 16);

const safeOutputSummary = (toolKey, output) => {
  // Never persist raw personal data. Produce minimal operational summaries only.
  if (!output) return "no output";
  const PRIVATE_TOOL_PREFIXES = ["life.", "account.", "learn.get"];
  if (PRIVATE_TOOL_PREFIXES.some((prefix) => toolKey.startsWith(prefix))) {
    const count = Array.isArray(output)
      ? output.length
      : Array.isArray(output?.items)
      ? output.items.length
      : Array.isArray(output?.activities)
      ? output.activities.length
      : typeof output === "object" && output !== null
      ? Object.keys(output).length
      : 1;
    return `${count} item(s) returned`;
  }
  // Public tools: safe to store a short summary
  const serialized = JSON.stringify(output);
  return serialized.length > 200 ? `${serialized.slice(0, 200)}…` : serialized;
};

/**
 * Execute a single registered tool, enforcing auth + permissions + entitlements.
 * Records an AgentToolExecution audit document.
 *
 * @param {string} toolKey
 * @param {object} input — Raw (unvalidated) input from provider
 * @param {object} context — {userId, user, entitlementResolution, conversationId, idempotencyKey}
 * @param {string} messageId — Optional: the AgentMessage that triggered this
 * @returns {{ tool, input: validatedInput, output }}
 */
const executeToolWithAudit = async (toolKey, input, context, messageId = null) => {
  const tool = registry.get(toolKey);

  // Unknown tool — DENY immediately
  if (!tool) {
    metrics.increment("tool_failures", { tool: "unknown" });
    metrics.increment("permission_denials", { tool: "unknown" });
    throw new AgentError(errorCodes.TOOL_NOT_FOUND, "That Agent tool is not available.", 404, { tool: toolKey });
  }

  const toolExecBase = {
    conversationId: context.conversationId,
    messageId: messageId || null,
    userId: context.userId,
    toolKey,
    toolVersion: tool.version,
    auditPolicy: tool.auditPolicy,
  };

  const startMs = Date.now();
  let execDoc = null;

  try {
    // Authorization (auth, entitlements, permission level, feature flags)
    await authorizeTool(tool, context);

    // Input validation + execution happen inside registry.execute()
    const result = await registry.execute(toolKey, input, {
      userId: context.userId,
      user: context.user,
      entitlementResolution: context.entitlementResolution,
      idempotencyKey: context.idempotencyKey || context.clientRequestId,
    });

    const latencyMs = Date.now() - startMs;
    metrics.increment("tool_executions", { tool: toolKey, status: "succeeded" });
    metrics.observe("agent_request_duration", latencyMs, { tool: toolKey });

    execDoc = await AgentToolExecution.create({
      ...toolExecBase,
      status: "succeeded",
      inputHash: hashInput(result.input),
      outputSummary: safeOutputSummary(toolKey, result.output),
      latencyMs,
    }).catch(() => null); // Audit failures must not block the response

    return { tool, input: result.input, output: result.output, executionId: execDoc ? String(execDoc._id) : null };
  } catch (error) {
    const latencyMs = Date.now() - startMs;
    const agentError = error instanceof AgentError ? error : AgentError.from(error);
    const status = agentError.code === errorCodes.PERMISSION_DENIED || agentError.code === errorCodes.AUTH_REQUIRED || agentError.code === errorCodes.ENTITLEMENT_REQUIRED
      ? "denied"
      : agentError.code === errorCodes.TIMEOUT
        ? "timed_out"
        : "failed";

    if (status === "denied") {
      metrics.increment("permission_denials", { tool: toolKey });
    }
    metrics.increment("tool_failures", { tool: toolKey, status });

    await AgentToolExecution.create({
      ...toolExecBase,
      status,
      inputHash: hashInput(input),
      outputSummary: null,
      errorCode: agentError.code,
      latencyMs,
    }).catch(() => null);

    throw agentError;
  }
};

/**
 * runAgentTurn — the main Agent orchestration function.
 *
 * Flow:
 *   1. Feature flag check
 *   2. Load bounded conversation context
 *   3. Provider processes user message and returns tool requests + response
 *      (provider calls executeTool callback for each tool it needs)
 *   4. Messages persisted
 *   5. Return {userMessage, assistantMessage, toolExecutions}
 *
 * @param {object} params
 * @param {string}  params.userId
 * @param {object}  params.user
 * @param {string}  params.conversationId
 * @param {string}  params.userMessageContent
 * @param {string}  params.inputMode — "typed" | "voice"
 * @param {string}  params.clientRequestId
 * @param {object}  params.pageContext — Safe hint only, never used for auth
 * @param {string}  params.requestId
 * @returns {{ userMessage, assistantMessage, toolExecutions: Array, conversation }}
 */
const runAgentTurn = async ({
  userId,
  user,
  conversationId,
  userMessageContent,
  inputMode = "typed",
  clientRequestId = null,
  pageContext = null,
  requestId = null,
}) => {
  const userHash = hashIdentifier(userId);
  const start = Date.now();

  // ── 1. Feature flag ─────────────────────────────────────────────────────────
  const agentEnabled = await featureFlags.isEnabled("agent_enabled", { user });
  if (!agentEnabled) {
    throw new AgentError(errorCodes.PROVIDER_UNAVAILABLE, "The MyJourney Agent is not available right now.", 503);
  }

  metrics.increment("agent_requests_total", { inputMode });
  logger.info("agent_turn_start", { requestId, conversationId, userHash, inputMode });

  // ── 2. Verify conversation ownership ────────────────────────────────────────
  const conversation = await conversationService.getConversation(conversationId, userId);

  // ── 3. Save user message (idempotent via unique index) ───────────────────────
  const userMessage = await conversationService.saveUserMessage(conversationId, userId, {
    content: userMessageContent,
    inputMode,
    clientRequestId,
  });

  const savedUserId = String(userMessage.userId || userId);

  // ── 4. Load bounded conversation context ────────────────────────────────────
  const contextMessages = await conversationService.getBoundedContext(conversationId);

  // ── 5. Build tool execution context ─────────────────────────────────────────
  const toolContext = {
    userId: savedUserId,
    user,
    conversationId,
    clientRequestId,
    idempotencyKey: clientRequestId,
    entitlementResolution: null, // Loaded lazily in permissionService
  };

  const toolExecutionIds = [];
  const toolExecutionRecords = [];
  let toolCallCount = 0;

  // ── 6. Run provider turn ────────────────────────────────────────────────────
  let providerResult;
  try {
    providerResult = await providerRegistry.runTurn({
      userMessage: userMessageContent,
      contextMessages,
      toolContext,
      executeTool: async (toolKey, toolInput, ctx) => {
        if (toolCallCount >= MAX_TOOL_CALLS_PER_TURN) {
          throw new AgentError(
            errorCodes.INTERNAL,
            "Maximum tool calls per turn reached.",
            429,
            { tool: toolKey }
          );
        }
        toolCallCount += 1;
        const result = await executeToolWithAudit(toolKey, toolInput, ctx || toolContext, userMessage._id);
        if (result.executionId) toolExecutionIds.push(result.executionId);
        toolExecutionRecords.push({
          toolKey,
          status: "succeeded",
          executionId: result.executionId,
        });
        // Return the full result to the provider
        return result;
      },
    });
  } catch (providerError) {
    logger.error("agent_provider_error", {
      requestId,
      conversationId,
      userHash,
      code: providerError?.code,
      latencyMs: Date.now() - start,
    });
    // Mark the user message as having failed (so UI can retry)
    // We don't delete it to preserve idempotency key
    throw providerError instanceof AgentError ? providerError : AgentError.from(providerError);
  }

  // ── 7. Validate response ────────────────────────────────────────────────────
  const assistantContent = String(providerResult?.content || "").trim();
  if (!assistantContent) {
    throw new AgentError(errorCodes.PROVIDER_RESPONSE_INVALID, "MyJourney returned an empty response.", 502);
  }

  // ── 8. Save assistant message ───────────────────────────────────────────────
  const assistantMessage = await conversationService.saveAssistantMessage(conversationId, userId, {
    content: assistantContent,
    toolExecutionIds,
  });

  const latencyMs = Date.now() - start;
  metrics.observe("agent_request_duration", latencyMs, { provider: providerResult.provider });
  logger.info("agent_turn_complete", {
    requestId,
    conversationId,
    userHash,
    provider: providerResult.provider,
    model: providerResult.model,
    latencyMs,
    toolCallCount,
  });

  return {
    userMessage,
    assistantMessage: {
      ...assistantMessage.toObject(),
      toolExecutions: toolExecutionRecords,
    },
    toolExecutions: toolExecutionRecords,
    conversation,
  };
};

module.exports = { runAgentTurn, executeToolWithAudit };
