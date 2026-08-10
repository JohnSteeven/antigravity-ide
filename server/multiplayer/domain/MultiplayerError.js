class MultiplayerError extends Error {
  constructor(code, message, { status = 400, retryable = false, details } = {}) {
    super(message);
    this.name = "MultiplayerError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.details = details;
  }
}

module.exports = MultiplayerError;
