"use strict";

const express = require("express");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const agentController = require("../controllers/agentController");
const { AgentError, errorCodes } = require("../agent/errors");

const router = express.Router();

// ─── Agent error handler ──────────────────────────────────────────────────────
// Applied last in this router so it catches AgentErrors from any handler above.
const agentErrorHandler = (error, req, res, next) => {
  if (error instanceof AgentError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }

  // Fall through to the app-level error handler for non-Agent errors
  return next(error);
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/agent/v1/capabilities
 *
 * Returns available tools, active provider, and limits.
 * Requires authentication so anonymous probing returns the same 401 as all
 * other authenticated endpoints. This makes the Agent's capability surface
 * opaque to unauthenticated callers.
 *
 * NOTE: optionalAuthenticate is used so the agent UI can read capabilities
 * before the user has signed in (to show a "Sign in to use Agent" state),
 * but sensitive provider health details should only be returned to authenticated
 * users. The controller handles this distinction.
 */
router.get("/capabilities", optionalAuthenticate, agentController.capabilities);

/**
 * Persistent conversation endpoints — ALL require authentication.
 * Identity comes from the authenticated server context exclusively.
 * Anonymous Agent interactions are not supported; a separate stateless
 * public flow must be implemented as an explicit future extension.
 */

// GET /api/agent/v1/conversations
// List the authenticated user's conversations (paginated)
router.get("/conversations", authenticate, agentController.listConversations);

// POST /api/agent/v1/conversations
// Create a new conversation for the authenticated user
router.post("/conversations", authenticate, agentController.createConversation);

// GET /api/agent/v1/conversations/:id/messages
// Load paginated messages for a conversation (ownership verified in controller)
router.get("/conversations/:id/messages", authenticate, agentController.getMessages);

// POST /api/agent/v1/conversations/:id/messages
// Send a user message and receive the assistant response
router.post("/conversations/:id/messages", authenticate, agentController.sendMessage);

// PATCH /api/agent/v1/conversations/:id
// Update conversation metadata (currently: archive)
router.patch("/conversations/:id", authenticate, agentController.updateConversation);

// ─── Route-level error handler ───────────────────────────────────────────────
router.use(agentErrorHandler);

module.exports = router;
