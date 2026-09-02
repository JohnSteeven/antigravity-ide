"use strict";

const mongoose = require("mongoose");

/**
 * AgentConfirmationToken — server-issued single-use token for CONFIRM_REQUIRED tools.
 *
 * Security properties:
 *   - Only tokenHash is persisted (SHA-256 of the raw token)
 *   - The raw token is returned to the client ONCE and never stored
 *   - Tokens are short-lived (AGENT_CONFIRMATION_TTL_SECONDS, default 5 min)
 *   - Single-use: status transitions pending → consumed on first valid verify
 *   - Bound to: userId + conversationId + toolKey + argsHash
 *   - Verification hashes the supplied raw token and compares with tokenHash
 */
const agentConfirmationTokenSchema = new mongoose.Schema(
  {
    // SHA-256 hex of the raw random token — the raw token is never stored
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 64,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentConversation",
      required: true,
    },
    toolKey: {
      type: String,
      required: true,
      maxlength: 100,
    },
    // SHA-256 of the canonical JSON of the validated tool arguments
    argsHash: {
      type: String,
      required: true,
      maxlength: 64,
    },
    status: {
      type: String,
      enum: ["pending", "consumed", "revoked"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "agentconfirmationtokens",
  }
);

// TTL index: MongoDB automatically removes expired tokens
agentConfirmationTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "agent_confirm_ttl" }
);

// Lookup for pending tokens matching the exact tool+args binding
agentConfirmationTokenSchema.index(
  { userId: 1, conversationId: 1, toolKey: 1, status: 1 },
  { name: "agent_confirm_user_lookup" }
);

const AgentConfirmationToken = mongoose.model("AgentConfirmationToken", agentConfirmationTokenSchema);

module.exports = AgentConfirmationToken;
