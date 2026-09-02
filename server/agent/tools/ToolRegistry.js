const { z } = require("zod");
const { AgentError, errorCodes } = require("../errors");

const DEFAULT_TOOL_TIMEOUT_MS = 5000;

const withTimeout = async (operation, timeoutMs, toolKey) => {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new AgentError(
          errorCodes.TOOL_TIMEOUT,
          `The ${toolKey} tool timed out.`,
          504,
          { tool: toolKey },
          true
        )), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(definition) {
    if (!definition?.key || typeof definition.execute !== "function") {
      throw new TypeError("Agent tools require a key and execute function.");
    }
    if (this.tools.has(definition.key)) {
      throw new TypeError(`Agent tool already registered: ${definition.key}`);
    }
    this.tools.set(definition.key, Object.freeze({
      version: "1.0.0",
      description: "",
      inputSchema: z.object({}).strict(),
      outputSchema: z.unknown(),
      permissionLevel: "READ",
      requiredEntitlements: [],
      authRequired: false,
      timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
      auditPolicy: "metadata",
      ...definition,
    }));
    return this;
  }

  get(key) {
    return this.tools.get(key) || null;
  }

  describe() {
    return [...this.tools.values()].map((tool) => ({
      key: tool.key,
      version: tool.version,
      description: tool.description,
      permissionLevel: tool.permissionLevel,
      requiredEntitlements: [...tool.requiredEntitlements],
      authRequired: tool.authRequired,
      timeoutMs: tool.timeoutMs,
      auditPolicy: tool.auditPolicy,
    }));
  }

  async execute(key, input, context) {
    const tool = this.get(key);
    if (!tool) {
      throw new AgentError(errorCodes.TOOL_NOT_FOUND, "That Agent tool is not available.", 404, { tool: key });
    }

    const parsed = tool.inputSchema.safeParse(input || {});
    if (!parsed.success) {
      throw new AgentError(
        errorCodes.TOOL_INVALID_INPUT,
        "The Agent tool request was invalid.",
        422,
        { tool: key, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })).slice(0, 10) }
      );
    }

    const output = await withTimeout(
      Promise.resolve().then(() => tool.execute(parsed.data, context)),
      Math.min(15000, Math.max(100, Number(tool.timeoutMs) || DEFAULT_TOOL_TIMEOUT_MS)),
      key
    );
    const validated = tool.outputSchema.safeParse(output);
    if (!validated.success) {
      throw new AgentError(errorCodes.TOOL_INVALID_OUTPUT, "The Agent tool returned an invalid result.", 502, { tool: key });
    }
    return { tool, input: parsed.data, output: validated.data };
  }
}

module.exports = { DEFAULT_TOOL_TIMEOUT_MS, ToolRegistry };
