const handleValidation = (validationResult) => (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Please correct the highlighted fields.",
      errors: errors.array(),
    });
  }

  next();
};

const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found." });
};

const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({
    message:
      status === 500
        ? "Something went wrong. Please try again."
        : error.message,
  });
};

module.exports = { errorHandler, handleValidation, notFound };
