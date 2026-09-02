"use strict";

const agentConfig = require("./config");
const { AgentError, errorCodes } = require("./errors");
const { CONVERSATION_STATUSES } = require("./constants");
const AgentConversation = require("../models/AgentConversation");
const AgentMessage = require("../models/AgentMessage");
const AgentToolExecution = require("../models/AgentToolExecution");

const idString = (value) => String(value?._id || value?.id || value || "");

// ─── Conversation CRUD ────────────────────────────────────────────────────────

/**
 * Create a new conversation for an authenticated user.
 * Identity always comes from the server — never from client payload.
 */
const createConversation = async (userId, { title = "" } = {}) => {
  const conversation = await AgentConversation.create({
    userId,
    title: String(title || "").slice(0, 200),
    status: CONVERSATION_STATUSES.ACTIVE,
    messageCount: 0,
    lastMessageAt: null,
  });
  return conversation;
};

/**
 * Load one conversation and verify ownership.
 * Returns null only when doNotThrow is true — otherwise throws.
 */
const getConversation = async (conversationId, userId, { doNotThrow = false } = {}) => {
  const conversation = await AgentConversation.findById(conversationId);

  if (!conversation) {
    if (doNotThrow) return null;
    throw new AgentError(errorCodes.CONVERSATION_NOT_FOUND, "Conversation not found.", 404);
  }

  if (idString(conversation.userId) !== idString(userId)) {
    // Return 404 rather than 403 to avoid confirming the conversation exists
    if (doNotThrow) return null;
    throw new AgentError(errorCodes.CONVERSATION_NOT_FOUND, "Conversation not found.", 404);
  }

  if (conversation.status === CONVERSATION_STATUSES.ARCHIVED) {
    if (doNotThrow) return null;
    throw new AgentError(errorCodes.CONVERSATION_ARCHIVED, "This conversation is archived.", 409);
  }

  return conversation;
};

/**
 * List conversations for a user (paginated, cursor-based).
 * Only returns conversations the authenticated user owns.
 */
const listConversations = async (userId, { cursor = null, limit = null } = {}) => {
  const pageSize = Math.min(limit || agentConfig.limits.conversationsPage, agentConfig.limits.conversationsPage);
  const query = { userId, status: CONVERSATION_STATUSES.ACTIVE };

  if (cursor) {
    try {
      // cursor is the lastMessageAt+_id of the last seen item
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");
      const { lastMessageAt, id } = JSON.parse(decoded);
      if (lastMessageAt && id) {
        query.$or = [
          { lastMessageAt: { $lt: new Date(lastMessageAt) } },
          { lastMessageAt: new Date(lastMessageAt), _id: { $lt: id } },
        ];
      }
    } catch (_parseError) {
      // Ignore invalid cursor — start from beginning
    }
  }

  const conversations = await AgentConversation.find(query)
    .sort({ lastMessageAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .lean();

  const hasMore = conversations.length > pageSize;
  const items = hasMore ? conversations.slice(0, pageSize) : conversations;

  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ lastMessageAt: last.lastMessageAt, id: String(last._id) })
    ).toString("base64");
  }

  return { conversations: items, nextCursor };
};

/**
 * Archive a conversation (soft status change, not deletion).
 * User must own the conversation.
 */
const archiveConversation = async (conversationId, userId) => {
  const conversation = await AgentConversation.findById(conversationId);
  if (!conversation || idString(conversation.userId) !== idString(userId)) {
    throw new AgentError(errorCodes.CONVERSATION_NOT_FOUND, "Conversation not found.", 404);
  }
  conversation.status = CONVERSATION_STATUSES.ARCHIVED;
  await conversation.save();
  return conversation;
};

// ─── Message CRUD ─────────────────────────────────────────────────────────────

/**
 * Save a user message. Returns the saved document.
 * The unique index on (userId, conversationId, clientRequestId) prevents
 * duplicate messages from retried requests at the database level.
 */
const saveUserMessage = async (conversationId, userId, { content, inputMode = "typed", clientRequestId = null }) => {
  const trimmed = String(content || "").trim().slice(0, agentConfig.limits.messageChars);
  if (!trimmed) throw new AgentError(errorCodes.REQUEST_INVALID, "Message content is required.", 422);

  let message;
  try {
    message = await AgentMessage.create({
      conversationId,
      userId,
      role: "user",
      content: trimmed,
      inputMode,
      clientRequestId: clientRequestId ? String(clientRequestId).slice(0, 128) : null,
    });
  } catch (error) {
    if (error?.code === 11000) {
      // Duplicate key = idempotent retry — load and return the existing message
      message = await AgentMessage.findOne({ userId, conversationId, clientRequestId }).lean();
      if (!message) throw AgentError.from(error, { code: errorCodes.INTERNAL, message: "Duplicate message lookup failed." });
      return message;
    }
    throw AgentError.from(error);
  }

  return message;
};

/**
 * Save an assistant message, linking it to the conversation and tool executions.
 */
const saveAssistantMessage = async (conversationId, userId, { content, toolExecutionIds = [] }) => {
  const trimmed = String(content || "").slice(0, agentConfig.limits.assistantChars);
  const message = await AgentMessage.create({
    conversationId,
    userId,
    role: "assistant",
    content: trimmed,
    inputMode: "system",
    toolExecutionIds,
  });

  // Update conversation metadata
  await AgentConversation.updateOne(
    { _id: conversationId },
    {
      $inc: { messageCount: 2 }, // user + assistant
      $set: { lastMessageAt: new Date() },
    }
  );

  return message;
};

/**
 * Load messages for a conversation (paginated, newest page = createdAt DESC,
 * but returned to caller in chronological order).
 */
const getMessages = async (conversationId, userId, { cursor = null, limit = null } = {}) => {
  const pageSize = Math.min(limit || agentConfig.limits.messagesPage, agentConfig.limits.messagesPage);

  const query = { conversationId, isDeleted: { $ne: true } };
  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");
      const { createdAt, id } = JSON.parse(decoded);
      if (createdAt && id) {
        query.$or = [
          { createdAt: { $lt: new Date(createdAt) } },
          { createdAt: new Date(createdAt), _id: { $lt: id } },
        ];
      }
    } catch (_parseError) {
      // Ignore invalid cursor
    }
  }

  const messages = await AgentMessage.find(query)
    .sort({ createdAt: -1, _id: -1 }) // Newest first for pagination
    .limit(pageSize + 1)
    .populate("toolExecutionIds", "toolKey status latencyMs outputSummary errorCode")
    .lean();

  const hasMore = messages.length > pageSize;
  const items = (hasMore ? messages.slice(0, pageSize) : messages).reverse(); // Back to chronological

  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const oldest = items[0]; // We're paginating backwards
    nextCursor = Buffer.from(
      JSON.stringify({ createdAt: oldest.createdAt, id: String(oldest._id) })
    ).toString("base64");
  }

  return { messages: items, nextCursor };
};

/**
 * Load a bounded window of messages for model context.
 * Returns user/assistant/tool messages only, in chronological order.
 * Never exceeds contextMessages limit or contextChars limit from config.
 */
const getBoundedContext = async (conversationId) => {
  const rawMessages = await AgentMessage.find({
    conversationId,
    role: { $in: ["user", "assistant"] },
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 }) // Most recent first
    .limit(agentConfig.limits.contextMessages)
    .select("role content createdAt")
    .lean();

  // Reverse to chronological, then trim to char budget
  const messages = rawMessages.reverse();
  let totalChars = 0;
  const result = [];
  for (const msg of messages) {
    const contentLen = (msg.content || "").length;
    if (totalChars + contentLen > agentConfig.limits.contextChars) break;
    totalChars += contentLen;
    result.push({ role: msg.role, content: String(msg.content || "").slice(0, 2000) });
  }

  return result;
};

/**
 * Soft-delete all conversations and messages for a user.
 * Called by account deletion lifecycle — not exposed to the Agent itself.
 */
const deleteAllForUser = async (userId) => {
  await AgentConversation.updateMany({ userId }, { $set: { isDeleted: true, deletedAt: new Date() } });
  await AgentMessage.updateMany({ userId }, { $set: { isDeleted: true } });
};

module.exports = {
  createConversation,
  getConversation,
  listConversations,
  archiveConversation,
  saveUserMessage,
  saveAssistantMessage,
  getMessages,
  getBoundedContext,
  deleteAllForUser,
};
