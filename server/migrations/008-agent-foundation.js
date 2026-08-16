"use strict";

/**
 * Migration 008 — MyJourney Agent Foundation
 *
 * Creates indexes for the four Agent collections:
 *   - agentconversations
 *   - agentmessages
 *   - agenttoolexecutions
 *   - agentconfirmationtokens
 *
 * IMPORTANT: Do NOT run this migration against production without first
 * verifying that the Agent feature flag is enabled and the Agent backend
 * has been deployed with all required models and services.
 *
 * The TTL index on agentconfirmationtokens.expiresAt (expireAfterSeconds: 0)
 * relies on MongoDB's TTL monitor to purge expired tokens automatically.
 * Ensure the MongoDB instance supports TTL indexes (all versions >= 2.2 do).
 */

const INDEXES = Object.freeze({
  agentconversations: [
    // Primary list query: active conversations for a user, sorted by recency
    [{ userId: 1, status: 1, lastMessageAt: -1 }, { name: "agent_conv_user_status_time" }],
    // Soft-delete exclusion (applied by pre-find hook in the model, not queried directly)
    [{ isDeleted: 1 }, { name: "agent_conv_deleted", sparse: true }],
  ],
  agentmessages: [
    // Primary read pattern: load a conversation's messages in chronological order
    [{ conversationId: 1, createdAt: 1 }, { name: "agent_msg_conv_time" }],
    // Idempotency: prevent duplicate messages from client retries
    // sparse: true so null clientRequestId rows are excluded from the unique constraint
    [
      { userId: 1, conversationId: 1, clientRequestId: 1 },
      {
        unique: true,
        sparse: true,
        partialFilterExpression: { clientRequestId: { $type: "string" } },
        name: "agent_msg_idempotency",
      },
    ],
  ],
  agenttoolexecutions: [
    // Audit: all tool executions for a conversation in order
    [{ conversationId: 1, createdAt: 1 }, { name: "agent_tool_conv_time" }],
    // Audit: user-level view across all conversations
    [{ userId: 1, createdAt: -1 }, { name: "agent_tool_user_time" }],
  ],
  agentconfirmationtokens: [
    // Primary lookup: always by tokenHash (unique — stores hash not raw token)
    [{ tokenHash: 1 }, { unique: true, name: "agent_confirm_token_hash" }],
    // Binding lookup: find pending tokens for user+conversation+tool
    [
      { userId: 1, conversationId: 1, toolKey: 1, status: 1 },
      { name: "agent_confirm_user_lookup" },
    ],
    // TTL: MongoDB automatically removes documents where expiresAt is in the past
    [{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "agent_confirm_ttl" }],
  ],
});

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const compatible = (existing, keys, options) =>
  same(existing.key, keys) &&
  Boolean(existing.unique) === Boolean(options.unique) &&
  Boolean(existing.sparse) === Boolean(options.sparse) &&
  (options.partialFilterExpression === undefined ||
    same(existing.partialFilterExpression, options.partialFilterExpression));

const ignoreMissing = (error) =>
  error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error);

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,

  async up(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes().catch(ignoreMissing);
      for (const [keys, options] of specs) {
        if (!existing.some((index) => compatible(index, keys, options))) {
          await collection.createIndex(keys, options);
          console.log(`[migration-008] Created index ${options.name} on ${collectionName}`);
        } else {
          console.log(`[migration-008] Index ${options.name} on ${collectionName} already exists, skipping`);
        }
      }
    }
  },

  async down(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      for (const [, options] of specs) {
        await db.collection(collectionName).dropIndex(options.name).catch(() => {});
        console.log(`[migration-008] Dropped index ${options.name} on ${collectionName} (if it existed)`);
      }
    }
  },
};
