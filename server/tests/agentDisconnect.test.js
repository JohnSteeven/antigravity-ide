"use strict";

const { EventEmitter } = require("events");
jest.mock("../agent/orchestrator", () => ({ runAgentTurn: jest.fn() }));
const { runAgentTurn } = require("../agent/orchestrator");
const { sendMessage } = require("../controllers/agentController");
const { userConcurrencyLimiter } = require("../agent/requestGuards");
const { AgentError, errorCodes } = require("../agent/errors");

describe("Journey AI disconnect cleanup", () => {
  afterEach(() => { jest.clearAllMocks(); userConcurrencyLimiter.reset(); });

  test("closing the client response aborts the provider signal and releases the user slot", async () => {
    let upstreamSignal;
    runAgentTurn.mockImplementation(({ signal }) => {
      upstreamSignal = signal;
      return new Promise((_, reject) => signal.addEventListener("abort", () => reject(new AgentError(errorCodes.CANCELLED, "stopped", 499)), { once: true }));
    });
    const req = { user: { _id: "507f1f77bcf86cd799439011" }, params: { id: "507f1f77bcf86cd799439012" }, body: { message: "Help me" } };
    const res = new EventEmitter();
    res.writableEnded = false;
    res.json = jest.fn();
    const next = jest.fn();
    const pending = sendMessage(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));
    expect(upstreamSignal.aborted).toBe(false);
    res.emit("close");
    await pending;
    expect(upstreamSignal.aborted).toBe(true);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: errorCodes.CANCELLED }));
    expect(userConcurrencyLimiter.totalActive()).toBe(0);
  });
});
