"use strict";

const mongoose = require("mongoose");

const agentMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentConversation",
      required: true,
    },
    // Denormalized for ownership queries without joining conversations
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "tool", "internal"],
      required: true,
    },
    // Content stored and capped server-side; client never controls this field
    content: {
      type: String,
      default: "",
      maxlength: 50000, // Hard schema cap; orchestrator enforces tighter limit
    },
    // Voice or typed — informational, never affects authorization
    inputMode: {
      type: String,
      enum: ["typed", "voice", "system", "tool"],
      default: "typed",
    },
    // Client-supplied idempotency key; unique per (userId, conversationId)
    clientRequestId: {
      type: String,
      default: null,
      maxlength: 128,
    },
    // For assistant messages: which tools were used
    toolExecutionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AgentToolExecution",
      },
    ],
    // Soft-delete inherits from conversation deletion; messages are purged
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "agentmessages",
  }
);

// Primary read pattern: load a conversation's messages in order
agentMessageSchema.index(
  { conversationId: 1, createdAt: 1 },
  { name: "agent_msg_conv_time" }
);

// Idempotency check: prevent duplicate messages from retried requests
agentMessageSchema.index(
  { userId: 1, conversationId: 1, clientRequestId: 1 },
  {
    unique: true,
    sparse: true, // clientRequestId may be null for system/assistant messages
    partialFilterExpression: { clientRequestId: { $type: "string" } },
    name: "agent_msg_idempotency",
  }
);

const AgentMessage = mongoose.model("AgentMessage", agentMessageSchema);

module.exports = AgentMessage;
