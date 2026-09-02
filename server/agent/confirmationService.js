"use strict";

const crypto = require("crypto");
const agentConfig = require("./config");
const { AgentError, errorCodes } = require("./errors");
const AgentConfirmationToken = require("../models/AgentConfirmationToken");

const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(String(rawToken)).digest("hex");

const hashArgs = (args) =>
  crypto.createHash("sha256").update(JSON.stringify(args ?? {})).digest("hex");

/**
 * Issue a new confirmation token for a CONFIRM_REQUIRED tool execution.
 *
 * Returns the raw token ONCE for delivery to the authenticated client.
 * The raw token is never persisted — only its SHA-256 hash is stored.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.conversationId
 * @param {string} params.toolKey
 * @param {object} params.validatedArgs — Already-validated tool arguments
 * @returns {{ token: string, expiresAt: Date, tokenId: string }}
 */
const issueToken = async ({ userId, conversationId, toolKey, validatedArgs }) => {
  const rawToken = crypto.randomUUID();
  const tokenHash = hashToken(rawToken);
  const argsHash = hashArgs(validatedArgs);
  const ttlSeconds = agentConfig.confirmation.ttlSeconds;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // Revoke any existing pending tokens for this user+conversation+tool
  // (prevents accumulation of orphaned pending tokens for the same action)
  await AgentConfirmationToken.updateMany(
    { userId, conversationId, toolKey, status: "pending" },
    { $set: { status: "revoked" } }
  );

  const record = await AgentConfirmationToken.create({
    tokenHash,
    userId,
    conversationId,
    toolKey,
    argsHash,
    status: "pending",
    expiresAt,
  });

  return { token: rawToken, expiresAt, tokenId: String(record._id) };
};

/**
 * Verify and atomically consume a confirmation token.
 *
 * Validates:
 *   - Token hash matches
 *   - Status is "pending"
 *   - Not expired
 *   - userId matches (server-authoritative)
 *   - conversationId matches
 *   - toolKey matches
 *   - argsHash matches (prevents reuse for different arguments)
 *
 * @param {object} params
 * @param {string} params.rawToken — Token returned to client at issue time
 * @param {string} params.userId  — From authenticated server context
 * @param {string} params.conversationId
 * @param {string} params.toolKey
 * @param {object} params.validatedArgs
 * @returns {AgentConfirmationToken}
 */
const verifyAndConsume = async ({ rawToken, userId, conversationId, toolKey, validatedArgs }) => {
  if (!rawToken) {
    throw new AgentError(
      errorCodes.CONFIRMATION_INVALID,
      "A confirmation token is required to complete this action.",
      422
    );
  }

  const tokenHash = hashToken(rawToken);
  const argsHash = hashArgs(validatedArgs);

  const record = await AgentConfirmationToken.findOne({
    tokenHash,
    userId,
    conversationId,
    toolKey,
    argsHash,
  });

  if (!record) {
    throw new AgentError(
      errorCodes.CONFIRMATION_INVALID,
      "The confirmation token is invalid or does not match this action.",
      422
    );
  }

  if (record.status === "consumed") {
    throw new AgentError(errorCodes.CONFIRMATION_USED, "This confirmation token has already been used.", 409);
  }

  if (record.status === "revoked") {
    throw new AgentError(errorCodes.CONFIRMATION_INVALID, "This confirmation token was revoked.", 422);
  }

  if (record.expiresAt <= new Date()) {
    throw new AgentError(errorCodes.CONFIRMATION_EXPIRED, "This confirmation token has expired. Please restart the action.", 410);
  }

  // Atomically mark as consumed
  const updated = await AgentConfirmationToken.findOneAndUpdate(
    { _id: record._id, status: "pending" },
    { $set: { status: "consumed", consumedAt: new Date() } },
    { new: true }
  );

  if (!updated || updated.status !== "consumed") {
    // Concurrent consume — treat as already used
    throw new AgentError(errorCodes.CONFIRMATION_USED, "This confirmation token has already been used.", 409);
  }

  return updated;
};

module.exports = { issueToken, verifyAndConsume, hashArgs };
