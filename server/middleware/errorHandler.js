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
    message = Object.values(error.errors || {})
      .map((err) => err.message)
      .join(" ");
  }

  if (status === 500) {
    console.error(`[ERROR] Internal Server Error:`, error.stack || error);
  }

  res.status(status).json({
    message:
      status === 500
        ? "Something went wrong. Please try again."
        : message,
    errors: error.errors || [],
  });
};

module.exports = { errorHandler, handleValidation, notFound };
