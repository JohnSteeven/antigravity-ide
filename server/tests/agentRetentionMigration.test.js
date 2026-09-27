"use strict";

const migration = require("../migrations/015-agent-retention");
const AgentConversation = require("../models/AgentConversation");
const AgentMessage = require("../models/AgentMessage");
const AgentToolExecution = require("../models/AgentToolExecution");

describe("Journey AI bounded retention", () => {
  test("new records have model-level TTL deadlines and usage metadata", () => {
    const now = Date.now();
    const conversation = new AgentConversation({ userId: "507f1f77bcf86cd799439011" });
    const message = new AgentMessage({ userId: "507f1f77bcf86cd799439011", conversationId: conversation._id, role: "assistant" });
    const audit = new AgentToolExecution({ userId: "507f1f77bcf86cd799439011", conversationId: conversation._id, toolKey: "play.listGames", status: "succeeded" });
    expect(conversation.expiresAt.getTime()).toBeGreaterThan(now);
    expect(message.expiresAt.getTime()).toBeGreaterThan(now);
    expect(audit.expiresAt.getTime()).toBeGreaterThan(message.expiresAt.getTime());
    expect(message.usage).toMatchObject({ inputTokens: 0, outputTokens: 0 });
  });

  test("migration backfills existing rows and creates idempotent TTL indexes", async () => {
    const collections = new Map();
    for (const name of Object.keys(migration.indexes)) {
      collections.set(name, { updateMany: jest.fn().mockResolvedValue({}), indexes: jest.fn().mockResolvedValue([]), createIndex: jest.fn().mockResolvedValue("created") });
    }
    await migration.up({ collection: (name) => collections.get(name) });
    for (const [name, collection] of collections) {
      expect(collection.updateMany).toHaveBeenCalledWith({ expiresAt: { $exists: false } }, expect.objectContaining({ $set: { expiresAt: expect.any(Date) } }));
      expect(collection.createIndex).toHaveBeenCalledWith({ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 }));
      expect(migration.indexes[name]).toHaveLength(1);
    }
  });
});
