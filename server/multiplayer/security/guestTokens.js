const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const { ERROR_CODES } = require("../domain/constants");
const MultiplayerError = require("../domain/MultiplayerError");

const issueGuestToken = ({ roomId, roomCode, playerId }) => jwt.sign({
  aud: "myjourney-multiplayer",
  iss: "myjourney-api",
  jti: crypto.randomUUID(),
  roomId: String(roomId),
  roomCode,
  playerId,
  kind: "guest-player",
}, env.multiplayer.guestSecret, { expiresIn: env.multiplayer.roomTtlHours * 60 * 60 });

const verifyGuestToken = (token) => {
  try {
    return jwt.verify(token, env.multiplayer.guestSecret, {
      audience: "myjourney-multiplayer",
      issuer: "myjourney-api",
    });
  } catch (error) {
    throw new MultiplayerError(
      ERROR_CODES.INVALID_TOKEN,
      "This game session has expired. Join the room again.",
      { status: 401 }
    );
  }
};

const hashIdentity = (value) => crypto
  .createHash("sha256")
  .update(`${env.multiplayer.analyticsSalt}:${value}`)
  .digest("hex");

module.exports = { hashIdentity, issueGuestToken, verifyGuestToken };
