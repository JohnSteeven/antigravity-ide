"use strict";

const mongoose = require("mongoose");

/**
 * AgentToolExecution — audit record for every tool the Agent runs.
 *
 * Privacy rules:
 *   - outputSummary must NEVER store raw journal entries, health records,
 *     financial data, full RAG documents, or model prompts.
 *   - Store only a minimal operational summary (status, item count, type).
 *   - The orchestrator is responsible for projecting before storing.
 */
const agentToolExecutionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentConversation",
      required: true,
    },
    // The AgentMessage that triggered this execution
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentMessage",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toolKey: {
      type: String,
      required: true,
      maxlength: 100,
    },
    toolVersion: {
      type: String,
      default: "1.0.0",
      maxlength: 20,
    },
    status: {
      type: String,
      enum: ["running", "succeeded", "failed", "denied", "confirmation_required", "timed_out"],
      required: true,
    },
    // SHA-256 of the tool input for deduplication/audit — not the raw input
    inputHash: {
      type: String,
      default: null,
      maxlength: 64,
    },
    // REDACTED: must never contain private user data — only operational metadata
    // Example acceptable values: "3 activities returned", "habit completed", "0 results"
    outputSummary: {
      type: String,
      default: null,
      maxlength: 500,
    },
    // Error code for failed executions (from AgentError.code)
    errorCode: {
      type: String,
      default: null,
      maxlength: 80,
    },
    latencyMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    // "metadata" = log key/status/latency only; "write" = additionally log write intent
    auditPolicy: {
      type: String,
      enum: ["metadata", "write"],
      default: "metadata",
    },
  },
  {
    timestamps: true,
    collection: "agenttoolexecutions",
  }
);

// Primary audit query: all tool executions for a conversation
agentToolExecutionSchema.index(
  { conversationId: 1, createdAt: 1 },
  { name: "agent_tool_conv_time" }
);

// User-level audit across all conversations
agentToolExecutionSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "agent_tool_user_time" }
);

const AgentToolExecution = mongoose.model("AgentToolExecution", agentToolExecutionSchema);

module.exports = AgentToolExecution;
