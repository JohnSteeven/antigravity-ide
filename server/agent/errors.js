"use strict";

const errorCodes = Object.freeze({
  PROVIDER_UNAVAILABLE: "AGENT_PROVIDER_UNAVAILABLE",
  PROVIDER_RESPONSE_INVALID: "AGENT_PROVIDER_RESPONSE_INVALID",
  TIMEOUT: "AGENT_TIMEOUT",
  // Distinct from TIMEOUT (provider-level). TOOL_TIMEOUT is raised when a single
  // registered tool exceeds its per-tool timeout budget.
  TOOL_TIMEOUT: "AGENT_TOOL_TIMEOUT",
  TOOL_INVALID_OUTPUT: "AGENT_TOOL_INVALID_OUTPUT",
  RATE_LIMITED: "AGENT_RATE_LIMITED",
  CONCURRENCY_LIMIT: "AGENT_CONCURRENCY_LIMIT",
  TOOL_NOT_FOUND: "AGENT_TOOL_NOT_FOUND",
  TOOL_INVALID_INPUT: "AGENT_TOOL_INVALID_INPUT",
  PERMISSION_DENIED: "AGENT_PERMISSION_DENIED",
  AUTH_REQUIRED: "AGENT_AUTH_REQUIRED",
  CONFIRMATION_REQUIRED: "AGENT_CONFIRMATION_REQUIRED",
  CONFIRMATION_EXPIRED: "AGENT_CONFIRMATION_EXPIRED",
  CONFIRMATION_INVALID: "AGENT_CONFIRMATION_INVALID",
  CONFIRMATION_USED: "AGENT_CONFIRMATION_USED",
  ENTITLEMENT_REQUIRED: "AGENT_ENTITLEMENT_REQUIRED",
  CONTEXT_LIMIT: "AGENT_CONTEXT_LIMIT",
  REQUEST_INVALID: "AGENT_REQUEST_INVALID",
  CONVERSATION_NOT_FOUND: "AGENT_CONVERSATION_NOT_FOUND",
  CONVERSATION_ARCHIVED: "AGENT_CONVERSATION_ARCHIVED",
  INTERNAL: "AGENT_INTERNAL_ERROR",
});

const defaultStatus = Object.freeze({
  [errorCodes.PROVIDER_UNAVAILABLE]: 503,
  [errorCodes.PROVIDER_RESPONSE_INVALID]: 502,
  [errorCodes.TIMEOUT]: 504,
  [errorCodes.TOOL_TIMEOUT]: 504,
  [errorCodes.TOOL_INVALID_OUTPUT]: 502,
  [errorCodes.RATE_LIMITED]: 429,
  [errorCodes.CONCURRENCY_LIMIT]: 429,
  [errorCodes.TOOL_NOT_FOUND]: 404,
  [errorCodes.TOOL_INVALID_INPUT]: 422,
  [errorCodes.PERMISSION_DENIED]: 403,
  [errorCodes.AUTH_REQUIRED]: 401,
  [errorCodes.CONFIRMATION_REQUIRED]: 409,
  [errorCodes.CONFIRMATION_EXPIRED]: 410,
  [errorCodes.CONFIRMATION_INVALID]: 422,
  [errorCodes.CONFIRMATION_USED]: 409,
  [errorCodes.ENTITLEMENT_REQUIRED]: 403,
  [errorCodes.CONTEXT_LIMIT]: 413,
  [errorCodes.REQUEST_INVALID]: 422,
  [errorCodes.CONVERSATION_NOT_FOUND]: 404,
  [errorCodes.CONVERSATION_ARCHIVED]: 409,
  [errorCodes.INTERNAL]: 500,
});

class AgentError extends Error {
  constructor(code, message, status, details = undefined, retryable = false) {
    super(message || "The MyJourney Agent could not complete this request.");
    this.name = "AgentError";
    this.code = code || errorCodes.INTERNAL;
    this.status = status || defaultStatus[this.code] || 500;
    this.details = details;
    this.retryable = Boolean(retryable);
    Error.captureStackTrace?.(this, AgentError);
  }

  toResponse() {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.details === undefined ? {} : { details: this.details }),
    };
  }

  static from(error, fallback = {}) {
    if (error instanceof AgentError) return error;
    return new AgentError(
      fallback.code || errorCodes.INTERNAL,
      fallback.message || "The MyJourney Agent could not complete this request.",
      fallback.status,
      fallback.details,
      fallback.retryable
    );
  }
}

module.exports = { AgentError, errorCodes };
