"use strict";

const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { AgentError, errorCodes } = require("../agent/errors");
const { PROVIDER_KEYS, PERMISSION_LEVELS } = require("../agent/constants");
const { MockAgentProvider } = require("../agent/providers/MockAgentProvider");
const { ToolRegistry } = require("../agent/tools/ToolRegistry");
const { authorizeTool, PERMISSIONS } = require("../agent/tools/permissionService");
const confirmationService = require("../agent/confirmationService");
const conversationService = require("../agent/conversationService");
const { runAgentTurn, executeToolWithAudit } = require("../agent/orchestrator");
const AgentConversation = require("../models/AgentConversation");
const AgentMessage = require("../models/AgentMessage");
const AgentToolExecution = require("../models/AgentToolExecution");
const AgentConfirmationToken = require("../models/AgentConfirmationToken");
const FeatureFlag = require("../models/FeatureFlag");
const entitlementService = require("../services/entitlementService");
const { registry: globalRegistry } = require("../agent/tools/index");
const express = require("express");
const request = require("supertest");

describe("MyJourney Agent — Domain & Orchestration Suite", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. MockAgentProvider: Real Tool Interaction & Deterministic Formatting
  // ───────────────────────────────────────────────────────────────────────────
  describe("MockAgentProvider", () => {
    test("exercises registered tools for 'What are today's activities?' using real tool output", async () => {
      const provider = new MockAgentProvider();
      expect(provider.key).toBe(PROVIDER_KEYS.MOCK);

      const executedTools = [];
      const mockExecuteTool = jest.fn(async (toolKey, input, context) => {
        executedTools.push({ toolKey, input, context });
        if (toolKey === "life.getToday") {
          return {
            tool: { key: "life.getToday" },
            output: {
              date: "2026-08-16",
              activities: [
                { title: "Morning Walk", scheduledTime: "07:00", status: "completed" },
                { title: "Review Learn Lesson", scheduledTime: "14:00", status: "scheduled" },
              ],
              summary: { planned: 2, completed: 1 },
              goals: [{ title: "Run 5k" }],
            },
          };
        }
        if (toolKey === "life.getHabits") {
          return {
            tool: { key: "life.getHabits" },
            output: { items: [{ name: "Drink Water", preferredPeriod: "morning" }] },
          };
        }
        return { tool: { key: toolKey }, output: {} };
      });

      const response = await provider.turn({
        userMessage: "What are today's activities?",
        contextMessages: [],
        executeTool: mockExecuteTool,
        toolContext: { userId: "user-123" },
      });

      expect(mockExecuteTool).toHaveBeenCalledWith("life.getToday", {}, { userId: "user-123" });
      expect(mockExecuteTool).toHaveBeenCalledWith("life.getHabits", {}, { userId: "user-123" });
      expect(response.content).toContain("Here are your activities for 2026-08-16:");
      expect(response.content).toContain("Morning Walk at 07:00 (completed)");
      expect(response.content).toContain("Review Learn Lesson at 14:00");
      expect(response.content).toContain("Drink Water");
      expect(response.toolCalls.length).toBe(2);
    });

    test("exercises goals tool for 'What are my goals?'", async () => {
      const provider = new MockAgentProvider();
      const mockExecuteTool = jest.fn(async (toolKey) => ({
        tool: { key: toolKey },
        output: { items: [{ title: "Complete System Design Course", progress: 0.75 }] },
      }));

      const response = await provider.turn({
        userMessage: "What are my goals?",
        contextMessages: [],
        executeTool: mockExecuteTool,
        toolContext: { userId: "user-123" },
      });

      expect(mockExecuteTool).toHaveBeenCalledWith("life.getGoals", {}, { userId: "user-123" });
      expect(response.content).toContain("Complete System Design Course — 75%");
    });

    test("propagates auth required message when tool execution fails with auth error", async () => {
      const provider = new MockAgentProvider();
      const mockExecuteTool = jest.fn(async () => {
        throw new AgentError(errorCodes.AUTH_REQUIRED, "Sign in required", 401);
      });

      const response = await provider.turn({
        userMessage: "What are today's activities?",
        contextMessages: [],
        executeTool: mockExecuteTool,
        toolContext: { userId: null },
      });

      expect(response.content).toContain("Sign in to MyJourney");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ToolRegistry: Schema Validation & Timeouts
  // ───────────────────────────────────────────────────────────────────────────
  describe("ToolRegistry", () => {
    test("validates input against schema with zod and executes successfully", async () => {
      const { z } = require("zod");
      const registry = new ToolRegistry();
      const execute = jest.fn(async ({ query }) => ({ result: `Found ${query}` }));

      registry.register({
        key: "test.search",
        version: "1.0.0",
        description: "Test search tool",
        permissionLevel: PERMISSION_LEVELS.READ,
        authRequired: false,
        inputSchema: z.object({ query: z.string().min(2) }),
        execute,
      });

      const res = await registry.execute("test.search", { query: "hello" }, {});
      expect(res.output).toEqual({ result: "Found hello" });
      expect(execute).toHaveBeenCalledWith({ query: "hello" }, {});
    });

    test("rejects invalid input schema with AGENT_TOOL_INVALID_INPUT (422)", async () => {
      const { z } = require("zod");
      const registry = new ToolRegistry();

      registry.register({
        key: "test.search",
        inputSchema: z.object({ query: z.string().min(3) }),
        execute: async () => ({}),
      });

      await expect(registry.execute("test.search", { query: "a" }, {})).rejects.toMatchObject({
        code: errorCodes.TOOL_INVALID_INPUT,
        status: 422,
      });
    });

    test("rejects unknown tool key with AGENT_TOOL_NOT_FOUND (404)", async () => {
      const registry = new ToolRegistry();
      await expect(registry.execute("nonexistent.tool", {}, {})).rejects.toMatchObject({
        code: errorCodes.TOOL_NOT_FOUND,
        status: 404,
      });
    });

    test("aborts and throws AGENT_TOOL_TIMEOUT (504) if tool execution exceeds timeout", async () => {
      const registry = new ToolRegistry();
      registry.register({
        key: "test.slow",
        timeoutMs: 50,
        execute: async () => new Promise((resolve) => setTimeout(resolve, 200)),
      });

      await expect(registry.execute("test.slow", {}, {})).rejects.toMatchObject({
        code: errorCodes.TOOL_TIMEOUT,
        status: 504,
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PermissionService: Authorization & Entitlements
  // ───────────────────────────────────────────────────────────────────────────
  describe("permissionService", () => {
    test("rejects auth-required tools when context has no userId", async () => {
      const tool = { key: "account.getProfile", authRequired: true };
      await expect(authorizeTool(tool, { userId: null })).rejects.toMatchObject({
        code: errorCodes.AUTH_REQUIRED,
        status: 401,
      });
    });

    test("rejects entitlement-required tools when user lacks entitlement", async () => {
      jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue({
        entitlements: { life_access: false },
      });

      const tool = {
        key: "life.getToday",
        authRequired: true,
        requiredEntitlements: ["life_access"],
      };

      await expect(authorizeTool(tool, { userId: "user-free" })).rejects.toMatchObject({
        code: errorCodes.ENTITLEMENT_REQUIRED,
        status: 403,
      });
    });

    test("rejects write tools when agent_write_tools_enabled feature flag is false", async () => {
      const agentFeatureFlags = require("../agent/featureFlags");
      agentFeatureFlags.clearCache();
      jest.spyOn(FeatureFlag, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ status: "disabled" }),
      });

      const tool = {
        key: "life.recordWater",
        authRequired: true,
        permissionLevel: PERMISSION_LEVELS.LOW_RISK_WRITE,
      };

      await expect(authorizeTool(tool, { userId: "user-1" })).rejects.toMatchObject({
        code: errorCodes.PERMISSION_DENIED,
        status: 403,
      });
      agentFeatureFlags.clearCache();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ConfirmationService: Hash Persistence, Verification & Single-Use
  // ───────────────────────────────────────────────────────────────────────────
  describe("confirmationService", () => {
    test("issueToken persists tokenHash (SHA-256) and returns raw token once", async () => {
      let createdDoc = null;
      jest.spyOn(AgentConfirmationToken, "updateMany").mockResolvedValue({ modifiedCount: 0 });
      jest.spyOn(AgentConfirmationToken, "create").mockImplementation(async (data) => {
        createdDoc = { _id: "token-doc-1", ...data };
        return createdDoc;
      });

      const validatedArgs = { amountMl: 500 };
      const { token, expiresAt, tokenId } = await confirmationService.issueToken({
        userId: "user-1",
        conversationId: "conv-1",
        toolKey: "life.recordWater",
        validatedArgs,
      });

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(10);
      expect(tokenId).toBe("token-doc-1");
      expect(createdDoc.tokenHash).toBe(crypto.createHash("sha256").update(token).digest("hex"));
      expect(createdDoc.tokenHash).not.toBe(token); // Raw token must NOT be stored
      expect(createdDoc.argsHash).toBe(confirmationService.hashArgs(validatedArgs));
      expect(createdDoc.status).toBe("pending");
      expect(expiresAt).toBeInstanceOf(Date);
    });

    test("verifyAndConsume validates bindings and consumes token atomically", async () => {
      const rawToken = "raw-random-secret-uuid";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const validatedArgs = { amountMl: 500 };
      const argsHash = confirmationService.hashArgs(validatedArgs);

      const record = {
        _id: "token-doc-1",
        tokenHash,
        userId: "user-1",
        conversationId: "conv-1",
        toolKey: "life.recordWater",
        argsHash,
        status: "pending",
        expiresAt: new Date(Date.now() + 60000),
      };

      jest.spyOn(AgentConfirmationToken, "findOne").mockResolvedValue(record);
      jest.spyOn(AgentConfirmationToken, "findOneAndUpdate").mockResolvedValue({
        ...record,
        status: "consumed",
        consumedAt: new Date(),
      });

      const consumed = await confirmationService.verifyAndConsume({
        rawToken,
        userId: "user-1",
        conversationId: "conv-1",
        toolKey: "life.recordWater",
        validatedArgs,
      });

      expect(consumed.status).toBe("consumed");
    });

    test("verifyAndConsume rejects already-consumed token with CONFIRMATION_USED (409)", async () => {
      const rawToken = "raw-secret";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const validatedArgs = {};
      const record = {
        _id: "token-doc-1",
        tokenHash,
        userId: "user-1",
        conversationId: "conv-1",
        toolKey: "life.recordWater",
        argsHash: confirmationService.hashArgs(validatedArgs),
        status: "consumed",
        expiresAt: new Date(Date.now() + 60000),
      };

      jest.spyOn(AgentConfirmationToken, "findOne").mockResolvedValue(record);

      await expect(
        confirmationService.verifyAndConsume({
          rawToken,
          userId: "user-1",
          conversationId: "conv-1",
          toolKey: "life.recordWater",
          validatedArgs,
        })
      ).rejects.toMatchObject({
        code: errorCodes.CONFIRMATION_USED,
        status: 409,
      });
    });

    test("verifyAndConsume rejects expired token with CONFIRMATION_EXPIRED (410)", async () => {
      const rawToken = "raw-secret";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const validatedArgs = {};
      const record = {
        _id: "token-doc-1",
        tokenHash,
        userId: "user-1",
        conversationId: "conv-1",
        toolKey: "life.recordWater",
        argsHash: confirmationService.hashArgs(validatedArgs),
        status: "pending",
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      jest.spyOn(AgentConfirmationToken, "findOne").mockResolvedValue(record);

      await expect(
        confirmationService.verifyAndConsume({
          rawToken,
          userId: "user-1",
          conversationId: "conv-1",
          toolKey: "life.recordWater",
          validatedArgs,
        })
      ).rejects.toMatchObject({
        code: errorCodes.CONFIRMATION_EXPIRED,
        status: 410,
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. ConversationService: Ownership Isolation & Idempotency
  // ───────────────────────────────────────────────────────────────────────────
  describe("conversationService", () => {
    test("enforces conversation ownership: throws 404 when User A accesses User B conversation", async () => {
      jest.spyOn(AgentConversation, "findById").mockResolvedValue({
        _id: "conv-b",
        userId: "user-b",
        status: "active",
      });

      await expect(conversationService.getConversation("conv-b", "user-a")).rejects.toMatchObject({
        code: errorCodes.CONVERSATION_NOT_FOUND,
        status: 404,
      });
    });

    test("idempotent message save: returns existing message on duplicate clientRequestId error", async () => {
      const existing = {
        _id: "msg-existing",
        userId: "user-1",
        conversationId: "conv-1",
        clientRequestId: "req-dup-1",
        content: "Original text",
        role: "user",
      };

      const duplicateError = new Error("E11000 duplicate key error");
      duplicateError.code = 11000;

      jest.spyOn(AgentMessage, "create").mockRejectedValue(duplicateError);
      jest.spyOn(AgentMessage, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(existing),
      });

      const result = await conversationService.saveUserMessage("conv-1", "user-1", {
        content: "Original text",
        clientRequestId: "req-dup-1",
      });

      expect(result).toEqual(existing);
    });

    test("bounded context loading enforces message count and character limits", async () => {
      const longText = "A".repeat(5000);
      const fakeMessages = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}: ${longText}`,
        createdAt: new Date(Date.now() - (20 - i) * 1000),
      }));

      jest.spyOn(AgentMessage, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(fakeMessages.slice(-12)), // limit 12
      });

      const context = await conversationService.getBoundedContext("conv-1");
      expect(context.length).toBeLessThanOrEqual(12);
      const totalChars = context.reduce((sum, m) => sum + m.content.length, 0);
      expect(totalChars).toBeLessThanOrEqual(24000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Orchestrator: Turn Execution, Tool Limits & Privacy Auditing
  // ───────────────────────────────────────────────────────────────────────────
  describe("orchestrator & privacy", () => {
    test("runAgentTurn completes turn, records audit without raw private records", async () => {
      jest.spyOn(FeatureFlag, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({ enabled: true }),
      });

      jest.spyOn(AgentConversation, "findById").mockResolvedValue({
        _id: "conv-1",
        userId: "user-1",
        status: "active",
      });

      jest.spyOn(AgentMessage, "create").mockImplementation(async (data) => ({
        _id: `msg-${data.role}`,
        ...data,
        toObject: () => ({ _id: `msg-${data.role}`, ...data }),
      }));

      jest.spyOn(AgentConversation, "updateOne").mockResolvedValue({});

      jest.spyOn(AgentMessage, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue({
        entitlements: { life_access: true },
      });

      const lifeDataService = require("../life/services/lifeDataService");
      jest.spyOn(lifeDataService, "listGoals").mockResolvedValue({
        items: [{ _id: "g1", title: "Run Marathon", why: "", status: "active", progress: 0.5 }],
        pagination: {},
      });

      let auditSaved = null;
      jest.spyOn(AgentToolExecution, "create").mockImplementation(async (data) => {
        auditSaved = data;
        return { _id: "exec-1", ...data };
      });

      const result = await runAgentTurn({
        userId: "user-1",
        user: { _id: "user-1" },
        conversationId: "conv-1",
        userMessageContent: "What are my goals?",
        clientRequestId: "req-1",
      });

      expect(result.userMessage).toBeDefined();
      expect(result.assistantMessage).toBeDefined();
      expect(auditSaved).toBeDefined();
      // Verify Privacy: outputSummary must NOT contain private records, only count or summary
      expect(auditSaved.outputSummary).toBe("1 item(s) returned");
      expect(auditSaved.userId).toBe("user-1");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Agent Routes & Authentication Enforcement
  // ───────────────────────────────────────────────────────────────────────────
  describe("agentRoutes API protection", () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    const agentRoutes = require("../routes/agentRoutes");
    app.use("/api/agent/v1", agentRoutes);

    test("GET /api/agent/v1/capabilities returns available tools list", async () => {
      const res = await request(app).get("/api/agent/v1/capabilities");
      expect(res.status).toBe(200);
      expect(res.body.tools).toBeInstanceOf(Array);
      expect(res.body.limits).toBeDefined();
    });

    test.each([
      ["get", "/api/agent/v1/conversations"],
      ["post", "/api/agent/v1/conversations"],
      ["get", "/api/agent/v1/conversations/conv-123/messages"],
      ["post", "/api/agent/v1/conversations/conv-123/messages"],
      ["patch", "/api/agent/v1/conversations/conv-123"],
    ])("%s %s rejects unauthenticated requests with 401", async (method, path) => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Authentication required");
    });
  });
});
