"use strict";

const { z } = require("zod");
const featureFlags = require("../agent/featureFlags");
const conversationService = require("../agent/conversationService");
const { providerRegistry } = require("../agent/providers/AgentProviderRegistry");
const { registry } = require("../agent/tools/index");
const { executeToolWithAudit, runAgentTurn } = require("../agent/orchestrator");
const { errorCodes } = require("../agent/errors");
const AgentMessage = require("../models/AgentMessage");
const AgentToolExecution = require("../models/AgentToolExecution");

describe("Agent execution boundaries", () => {
  afterEach(() => jest.restoreAllMocks());

  test("never executes a confirmation-required tool without a supported confirmation flow", async () => {
    const execute = jest.fn().mockResolvedValue({ changed: true });
    jest.spyOn(registry, "get").mockReturnValue({
      key: "test.confirmedAction", version: "1", authRequired: true,
      permissionLevel: "CONFIRM_REQUIRED", inputSchema: z.object({}).strict(),
      outputSchema: z.unknown(), execute,
    });
    const audit = jest.spyOn(AgentToolExecution, "create").mockResolvedValue({ _id: "audit-1" });
    await expect(executeToolWithAudit("test.confirmedAction", {}, { userId: "user-a", conversationId: "conversation-a" }))
      .rejects.toMatchObject({ code: errorCodes.CONFIRMATION_REQUIRED, status: 409 });
    expect(execute).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ status: "denied", errorCode: errorCodes.CONFIRMATION_REQUIRED }));
  });

  test("derives write dedupe identity from the saved message when the client omits a key", async () => {
    jest.spyOn(featureFlags, "isEnabled").mockResolvedValue(true);
    jest.spyOn(conversationService, "getConversation").mockResolvedValue({ _id: "conversation-a", userId: "user-a" });
    jest.spyOn(conversationService, "saveUserMessage")
      .mockResolvedValueOnce({ _id: "message-one", userId: "user-a" })
      .mockResolvedValueOnce({ _id: "message-two", userId: "user-a" })
      .mockResolvedValueOnce({ _id: "message-one", userId: "user-a" });
    jest.spyOn(conversationService, "getBoundedContext").mockResolvedValue([]);
    jest.spyOn(conversationService, "saveAssistantMessage").mockResolvedValue({ toObject: () => ({ content: "Done" }) });
    const provider = jest.spyOn(providerRegistry, "runTurn").mockResolvedValue({ content: "Done", provider: "test", model: "test" });
    jest.spyOn(console, "info").mockImplementation(() => {});
    for (let index = 0; index < 3; index += 1) {
      await runAgentTurn({ userId: "user-a", user: { _id: "user-a" }, conversationId: "conversation-a", userMessageContent: "Create a task" });
    }
    expect(provider.mock.calls.map(([args]) => args.toolContext.idempotencyKey)).toEqual(["message-one", "message-two", "message-one"]);
  });

  test.each([
    { content: "Different request", role: "user", inputMode: "typed" },
    { content: "Original request", role: "assistant", inputMode: "typed" },
    { content: "Original request", role: "user", inputMode: "voice" },
  ])("rejects a reused client identifier with conflicting message identity: %j", async (existing) => {
    jest.spyOn(AgentMessage, "create").mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    jest.spyOn(AgentMessage, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(existing) });
    await expect(conversationService.saveUserMessage("conversation-a", "user-a", {
      content: "Original request", clientRequestId: "request-a", inputMode: "typed",
    })).rejects.toMatchObject({ status: 409, code: errorCodes.REQUEST_INVALID });
  });

  test("uses the same normalized idempotency key for insertion and duplicate lookup", async () => {
    const existing = { role: "user", content: "Original request", inputMode: "typed" };
    const create = jest.spyOn(AgentMessage, "create").mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    const find = jest.spyOn(AgentMessage, "findOne").mockReturnValue({ lean: jest.fn().mockResolvedValue(existing) });
    await expect(conversationService.saveUserMessage("conversation-a", "user-a", {
      content: "Original request", clientRequestId: "a".repeat(200),
    })).resolves.toEqual(existing);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ clientRequestId: "a".repeat(128) }));
    expect(find).toHaveBeenCalledWith({ conversationId: "conversation-a", userId: "user-a", clientRequestId: "a".repeat(128) });
  });
});
