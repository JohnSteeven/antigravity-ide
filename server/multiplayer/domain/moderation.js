const sanitizeHtml = require("sanitize-html");
const { ERROR_CODES } = require("./constants");
const MultiplayerError = require("./MultiplayerError");

const BLOCKED_TERMS = ["admin", "moderator", "support", "fuck", "shit"];

const normalizeNickname = (value) => sanitizeHtml(String(value || ""), {
  allowedTags: [],
  allowedAttributes: {},
})
  .normalize("NFKC")
  .replace(/[\u0000-\u001f\u007f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 24);

const validateNickname = (value) => {
  const nickname = normalizeNickname(value);
  if (nickname.length < 2) {
    throw new MultiplayerError(
      ERROR_CODES.BAD_REQUEST,
      "Nickname must be between 2 and 24 characters."
    );
  }

  const folded = nickname.toLocaleLowerCase("en");
  if (BLOCKED_TERMS.some((term) => folded.includes(term))) {
    throw new MultiplayerError(
      ERROR_CODES.NICKNAME_BLOCKED,
      "Please choose a different nickname."
    );
  }

  return nickname;
};

module.exports = { normalizeNickname, validateNickname };
