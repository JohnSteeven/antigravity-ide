"use strict";

const agentConfig = require("../agent/config");
const { AgentError, errorCodes } = require("../agent/errors");
const { requestRateLimiter, userConcurrencyLimiter } = require("../agent/requestGuards");
const { metrics, logger, hashIdentifier } = require("../agent/observability");
const { registry } = require("../agent/tools/index");
const { providerRegistry } = require("../agent/providers/AgentProviderRegistry");
const conversationService = require("../agent/conversationService");
const { runAgentTurn } = require("../agent/orchestrator");

const makeRequestId = () =>
  `agt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const idString = (v) => String(v?._id || v?.id || v || "");

// Safe serializer: strip fields that must never reach the client
const serializeMessage = (message) => {
  const obj = message?.toObject ? message.toObject() : { ...message };
  // Remove internal/tool-only messages from client view
  delete obj.__v;
  delete obj.isDeleted;
  // Truncate content to safe length if it somehow exceeded limits
  if (obj.content) obj.content = String(obj.content).slice(0, agentConfig.limits.assistantChars);
  return obj;
};

const serializeConversation = (conv) => {
  const obj = conv?.toObject ? conv.toObject() : { ...conv };
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

// ─── Capabilities ─────────────────────────────────────────────────────────────

exports.capabilities = async (req, res, next) => {
  try {
    const tools = registry.describe();
    const providers = providerRegistry.describe();
    const health = await providerRegistry.getHealth();

    return res.json({
      agentEnabled: agentConfig.enabled,
      provider: {
        active: agentConfig.provider || "mock",
        available: health.providers,
        circuits: health.circuits,
      },
      tools: tools.map((t) => ({
        key: t.key,
        description: t.description || "",
        permissionLevel: t.permissionLevel,
        authRequired: t.authRequired,
        requiredEntitlements: t.requiredEntitlements,
      })),
      limits: {
        messageMaxChars: agentConfig.limits.messageChars,
        contextMaxMessages: agentConfig.limits.contextMessages,
        conversationsPage: agentConfig.limits.conversationsPage,
        messagesPage: agentConfig.limits.messagesPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Conversations ────────────────────────────────────────────────────────────

exports.listConversations = async (req, res, next) => {
  try {
    const userId = idString(req.user);
    const { cursor, limit } = req.query;
    const parsedLimit = Number.isFinite(parseInt(limit, 10)) ? parseInt(limit, 10) : null;

    const result = await conversationService.listConversations(userId, { cursor: cursor || null, limit: parsedLimit });

    return res.json({
      conversations: result.conversations.map(serializeConversation),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    next(error instanceof AgentError ? error : AgentError.from(error));
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const userId = idString(req.user);
    const title = String(req.body?.title || "").slice(0, 200);
    const conversation = await conversationService.createConversation(userId, { title });

    return res.status(201).json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    next(error instanceof AgentError ? error : AgentError.from(error));
  }
};

// ─── Messages ─────────────────────────────────────────────────────────────────

exports.getMessages = async (req, res, next) => {
  try {
    const userId = idString(req.user);
    const { id: conversationId } = req.params;
    const { cursor, limit } = req.query;

    // Verify ownership before returning any messages
    await conversationService.getConversation(conversationId, userId);

    const parsedLimit = Number.isFinite(parseInt(limit, 10)) ? parseInt(limit, 10) : null;
    const result = await conversationService.getMessages(conversationId, userId, {
      cursor: cursor || null,
      limit: parsedLimit,
    });

    return res.json({
      messages: result.messages.map(serializeMessage),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    next(error instanceof AgentError ? error : AgentError.from(error));
  }
};

exports.sendMessage = async (req, res, next) => {
  const requestId = makeRequestId();
  const userId = idString(req.user);
  const userHash = hashIdentifier(userId);
  const { id: conversationId } = req.params;

  // ── Rate limit (per user) ───────────────────────────────────────────────────
  try {
    requestRateLimiter.consume(userId);
  } catch (rateLimitError) {
    metrics.increment("rate_limit_rejections");
    return next(rateLimitError);
  }

  // ── Concurrency limit (per user) ────────────────────────────────────────────
  let releaseSlot;
  try {
    releaseSlot = userConcurrencyLimiter.acquire(userId);
  } catch (concurrencyError) {
    return next(concurrencyError);
  }

  try {
    const {
      message,
      source = "typed",
      clientRequestId = null,
      pageContext = null,
    } = req.body || {};

    // ── Validate message content ──────────────────────────────────────────────
    const messageText = String(message || "").trim();
    if (!messageText) {
      throw new AgentError(errorCodes.REQUEST_INVALID, "A message is required.", 422);
    }
    if (messageText.length > agentConfig.limits.messageChars) {
      throw new AgentError(
        errorCodes.CONTEXT_LIMIT,
        `Message too long. Maximum is ${agentConfig.limits.messageChars} characters.`,
        413
      );
    }

    const inputMode = source === "voice" ? "voice" : "typed";

    // pageContext is a safe hint only — never used for authorization
    const safePageContext = pageContext && typeof pageContext === "object"
      ? { currentRoute: String(pageContext.currentRoute || "").slice(0, 200) }
      : null;

    const result = await runAgentTurn({
      userId,
      user: req.user,
      conversationId,
      userMessageContent: messageText,
      inputMode,
      clientRequestId: clientRequestId ? String(clientRequestId).slice(0, 128) : null,
      pageContext: safePageContext,
      requestId,
    });

    return res.json({
      userMessage: serializeMessage(result.userMessage),
      assistantMessage: serializeMessage(result.assistantMessage),
      toolExecutions: result.toolExecutions,
      conversation: serializeConversation(result.conversation),
    });
  } catch (error) {
    logger.error("agent_send_message_error", {
      requestId,
      conversationId,
      userHash,
      code: error?.code,
      message: error?.message?.slice(0, 200),
    });
    const agentError = error instanceof AgentError ? error : AgentError.from(error);
    return next(agentError);
  } finally {
    releaseSlot?.();
  }
};

// ─── Update conversation (archive) ───────────────────────────────────────────

exports.updateConversation = async (req, res, next) => {
  try {
    const userId = idString(req.user);
    const { id: conversationId } = req.params;
    const { archived, title } = req.body || {};

    if (archived === true) {
      const conversation = await conversationService.archiveConversation(conversationId, userId);
      return res.json({ conversation: serializeConversation(conversation) });
    }

    const conversation = await conversationService.getConversation(conversationId, userId);
    if (title !== undefined) {
      conversation.title = String(title).slice(0, 200);
      await conversation.save();
    }

    return res.json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    next(error instanceof AgentError ? error : AgentError.from(error));
  }
};
