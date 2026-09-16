"use strict";

const http = require("http");
const { EventEmitter } = require("events");

jest.mock("../agent/config", () => {
  const config = jest.requireActual("../agent/config");
  return {
    ...config,
    local: { endpoint: "http://agent-provider.invalid/v1", healthEndpoint: "", model: "test-model", apiKey: "" },
    limits: { ...config.limits, toolIterations: 3 },
  };
});

const { LocalAgentProvider } = require("../agent/providers/LocalAgentProvider");
const { AgentError, errorCodes } = require("../agent/errors");

describe("Local Agent provider response and usage accounting", () => {
  let responses;
  let requests;

  beforeEach(() => {
    responses = [];
    requests = [];
    jest.spyOn(http, "request").mockImplementation((options, callback) => {
      const request = new EventEmitter();
      request.setTimeout = jest.fn();
      request.destroy = jest.fn();
      request.write = (body) => requests.push(JSON.parse(body));
      request.end = () => {
        const result = options.method === "GET" ? { status: 200, body: { data: [] } } : responses.shift();
        if (!result) throw new Error("Unexpected provider request in test");
        const response = new EventEmitter();
        response.statusCode = result.status;
        callback(response);
        queueMicrotask(() => {
          response.emit("data", JSON.stringify(result.body));
          response.emit("end");
        });
      };
      return request;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const reply = (content, usage) => ({ status: 200, body: { choices: [{ message: { content } }], ...(usage ? { usage } : {}) } });
  const turn = (executeTool = jest.fn()) => new LocalAgentProvider().turn({ userMessage: "Help me plan", executeTool, toolContext: { userId: "user-a" } });

  test("returns successful text and actual usage without a block-scope error", async () => {
    responses.push(reply("A helpful answer", { prompt_tokens: 11, completion_tokens: 7 }));
    await expect(turn()).resolves.toMatchObject({ content: "A helpful answer", inputTokens: 11, outputTokens: 7, toolCalls: [] });
    expect(requests).toHaveLength(1);
  });

  test("adds usage across all tool iterations and returns the final answer", async () => {
    responses.push(
      reply('<tool_call>{"tool":"life.getToday","input":{}}</tool_call>', { prompt_tokens: 10, completion_tokens: 3 }),
      reply('<tool_call>{"tool":"life.getHabits","input":{}}</tool_call>', { prompt_tokens: 20, completion_tokens: 4 }),
      reply("Your plan is ready", { prompt_tokens: 30, completion_tokens: 5 })
    );
    const executeTool = jest.fn().mockResolvedValue({ output: { items: [] } });
    const result = await turn(executeTool);
    expect(result).toMatchObject({ content: "Your plan is ready", inputTokens: 60, outputTokens: 12 });
    expect(executeTool).toHaveBeenCalledTimes(2);
    expect(requests).toHaveLength(3);
  });

  test.each([undefined, { prompt_tokens: -10, completion_tokens: 1.5 }, { prompt_tokens: "10", completion_tokens: null }])(
    "does not invent or accept invalid token counts: %j", async (usage) => {
      responses.push(reply("Answer", usage));
      await expect(turn()).resolves.toMatchObject({ inputTokens: 0, outputTokens: 0 });
    }
  );

  test("rejects a non-success HTTP status even if the body looks successful", async () => {
    responses.push({ ...reply("Do not show this", { prompt_tokens: 1 }), status: 429 });
    await expect(turn()).rejects.toMatchObject({ code: errorCodes.PROVIDER_UNAVAILABLE, status: 503 });
  });

  test("rejects a successful HTTP response with no answer", async () => {
    responses.push({ status: 200, body: { choices: [] } });
    await expect(turn()).rejects.toMatchObject({ code: errorCodes.PROVIDER_RESPONSE_INVALID });
  });

  test.each([errorCodes.PERMISSION_DENIED, errorCodes.CONFIRMATION_REQUIRED])(
    "propagates an authorization boundary instead of continuing generation: %s", async (code) => {
      responses.push(reply('<tool_call>{"tool":"life.createTask","input":{}}</tool_call>'));
      await expect(turn(jest.fn().mockRejectedValue(new AgentError(code, "Action blocked")))).rejects.toMatchObject({ code });
      expect(requests).toHaveLength(1);
    }
  );
});
