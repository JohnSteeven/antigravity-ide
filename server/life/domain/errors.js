class LifeError extends Error {
  constructor(message, status = 400, code = "LIFE_REQUEST_INVALID") {
    super(message);
    this.name = "LifeError";
    this.status = status;
    this.code = code;
  }
}

const notFound = (label = "Life item") => new LifeError(`${label} was not found.`, 404, "LIFE_NOT_FOUND");
const conflict = (message) => new LifeError(message, 409, "LIFE_CONFLICT");

module.exports = { LifeError, conflict, notFound };
