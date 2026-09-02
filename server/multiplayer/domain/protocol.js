const { z } = require("zod");
const { ROOM_CODE_PATTERN } = require("./constants");

const requestId = z.string().uuid();
const roomCode = z.string().trim().toUpperCase().regex(ROOM_CODE_PATTERN);
const nickname = z.string().trim().min(2).max(48);

const restSchemas = {
  createRoom: z.object({
    gameKey: z.string().regex(/^[a-z0-9-]{3,60}$/),
    nickname,
    locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).default("en"),
  }).strict(),
  joinRoom: z.object({ nickname }).strict(),
  resumeRoom: z.object({ token: z.string().min(32).max(4096) }).strict(),
};

const socketSchemas = {
  "room:sync": z.object({ requestId }).strict(),
  "host:prepare": z.object({
    requestId,
    questionCount: z.number().int().min(3).max(12),
    roundDurationSec: z.number().int().min(10).max(60),
    categories: z.array(z.string().min(1).max(40)).min(1).max(12),
  }).strict(),
  "host:setup": z.object({
    requestId,
    answers: z.record(z.string(), z.string().min(1).max(80)),
  }).strict(),
  "game:start": z.object({ requestId }).strict(),
  "round:answer": z.object({
    requestId,
    questionId: z.string().min(1).max(80),
    choiceId: z.string().min(1).max(80),
  }).strict(),
  "round:advance": z.object({ requestId }).strict(),
  "game:rematch": z.object({ requestId }).strict(),
  "party:switch-game": z.object({
    requestId,
    gameKey: z.string().regex(/^[a-z0-9-]{3,60}$/),
  }).strict(),
  "host:transfer": z.object({ requestId, targetPlayerId: z.string().uuid() }).strict(),
  "player:remove": z.object({ requestId, targetPlayerId: z.string().uuid() }).strict(),
  "game:command": z.object({
    requestId,
    command: z.string().regex(/^[a-z][a-z0-9:_-]{1,60}$/),
    payload: z.record(z.string(), z.unknown()).refine(
      (value) => JSON.stringify(value).length <= 8192,
      "Game command payload is too large."
    ),
  }).strict(),
};

const parse = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = new Error("Invalid multiplayer event payload.");
    error.code = "MULTIPLAYER_BAD_REQUEST";
    error.status = 422;
    error.details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw error;
  }
  return result.data;
};

module.exports = { parse, restSchemas, roomCode, socketSchemas };
