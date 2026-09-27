"use strict";

// Explicit migration; startup never applies data migrations automatically.
// Existing records receive a fresh bounded window to avoid abrupt deletion.
const config = require("../agent/config");

const INDEXES = Object.freeze({
  agentconversations: [[{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "agent_conv_retention_ttl" }]],
  agentmessages: [[{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "agent_msg_retention_ttl" }]],
  agenttoolexecutions: [[{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "agent_tool_retention_ttl" }]],
});

const DAYS = Object.freeze({
  agentconversations: config.retention.conversationDays,
  agentmessages: config.retention.conversationDays,
  agenttoolexecutions: config.retention.toolAuditDays,
});

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,
  async up(db) {
    for (const [name, [[keys, options]]] of Object.entries(INDEXES)) {
      const collection = db.collection(name);
      await collection.updateMany({ expiresAt: { $exists: false } }, {
        $set: { expiresAt: new Date(Date.now() + DAYS[name] * 86400000) },
      });
      const existing = await collection.indexes().catch((error) => error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error));
      if (!existing.some((index) => index.name === options.name)) await collection.createIndex(keys, options);
    }
  },
  async down(db) {
    for (const [name, [[, options]]] of Object.entries(INDEXES)) {
      await db.collection(name).dropIndex(options.name).catch(() => {});
    }
  },
};
