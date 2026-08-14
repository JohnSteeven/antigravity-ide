const handleValidation = (validationResult) => (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorList = errors.array();
    return res.status(422).json({
      message: errorList[0].msg || "Please correct the highlighted fields.",
      errors: errorList,
    });
  }

  next();
};

const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found." });
};

const errorHandler = (error, req, res, next) => {
  let status = error.status || 500;
  let message = error.message;

  if (error.name === "ValidationError") {
    status = 400;
    console.error("[Mongoose ValidationError]", error);
    message = "We couldn't process your request. Please check your inputs and try again.";
  } else if (error.name === "MongoServerError" || error.code === 11000) {
    status = 409;
    console.error("[MongoServerError]", error);
    message = "A database conflict occurred. The resource may already exist.";
  } else if (status === 500) {
    console.error(`[ERROR] Internal Server Error:`, error.stack || error);
    message = "Something went wrong. Please try again.";
  }

  const payload = { message };
  if (typeof error.code === "string" && status < 500) payload.code = error.code;
  if (error.code && String(error.code).startsWith("MULTIPLAYER_")) {
    payload.error = {
      code: error.code,
      message,
      retryable: Boolean(error.retryable),
      ...(error.details ? { details: error.details } : {}),
    };
  }

  res.status(status).json(payload);
};

module.exports = { errorHandler, handleValidation, notFound };
