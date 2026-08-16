"use strict";

const PROVIDER_KEYS = Object.freeze({
  MOCK: "mock",
  LOCAL: "local",
  CMS: "cms",
  FUTURE_CLOUD: "future_cloud",
});

const PERMISSION_LEVELS = Object.freeze({
  READ: "READ",
  LOW_RISK_WRITE: "LOW_RISK_WRITE",
  CONFIRM_REQUIRED: "CONFIRM_REQUIRED",
  SENSITIVE: "SENSITIVE",
});

const CONVERSATION_STATUSES = Object.freeze({
  ACTIVE: "active",
  ARCHIVED: "archived",
});

const MESSAGE_ROLES = Object.freeze({
  USER: "user",
  ASSISTANT: "assistant",
  TOOL: "tool",
  INTERNAL: "internal",
});

const MESSAGE_INPUT_MODES = Object.freeze({
  TYPED: "typed",
  VOICE: "voice",
  SYSTEM: "system",
  TOOL: "tool",
});

const TOOL_EXECUTION_STATUSES = Object.freeze({
  REQUESTED: "requested",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  DENIED: "denied",
  CONFIRMATION_REQUIRED: "confirmation_required",
  TIMED_OUT: "timed_out",
});

const CONFIRMATION_STATUSES = Object.freeze({
  PENDING: "pending",
  CONSUMED: "consumed",
  REVOKED: "revoked",
});

const USER_VISIBLE_MESSAGE_ROLES = Object.freeze([
  MESSAGE_ROLES.USER,
  MESSAGE_ROLES.ASSISTANT,
]);

const CONTEXT_MESSAGE_ROLES = Object.freeze([
  MESSAGE_ROLES.USER,
  MESSAGE_ROLES.ASSISTANT,
  MESSAGE_ROLES.TOOL,
]);

module.exports = {
  CONFIRMATION_STATUSES,
  CONTEXT_MESSAGE_ROLES,
  CONVERSATION_STATUSES,
  MESSAGE_INPUT_MODES,
  MESSAGE_ROLES,
  PERMISSION_LEVELS,
  PROVIDER_KEYS,
  TOOL_EXECUTION_STATUSES,
  USER_VISIBLE_MESSAGE_ROLES,
};
