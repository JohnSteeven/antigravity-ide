'use strict';

const safeRequestId = (req) => req?.id || undefined;

const handleValidation = (validationResult) => (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorList = errors.array().map((entry) => ({
      type: entry.type,
      location: entry.location,
      path: entry.path,
      msg: entry.msg,
    }));
    return res.status(422).json({
      message: errorList[0].msg || 'Please correct the highlighted fields.',
      errors: errorList,
      ...(safeRequestId(req) ? { requestId: safeRequestId(req) } : {}),
    });
  }

  return next();
};

const notFound = (req, res) => res.status(404).json({
  message: 'Route not found.',
  ...(safeRequestId(req) ? { requestId: safeRequestId(req) } : {}),
});

const normalizedErrorType = (error) => String(error?.name || 'Error')
  .replace(/[^a-zA-Z0-9_-]/g, '')
  .slice(0, 64) || 'Error';

const safePublicCode = (error, status) => {
  if (status >= 500 || typeof error?.code !== 'string') return undefined;
  return /^[A-Z0-9_]{2,64}$/.test(error.code) ? error.code : undefined;
};

const writeErrorEvent = (error, req, status) => {
  const event = {
    timestamp: new Date().toISOString(),
    level: status >= 500 ? 'error' : 'warn',
    service: 'myjourney-api',
    event: 'request_error',
    requestId: safeRequestId(req),
    method: req?.method,
    route: typeof req?.route?.path === 'string' ? req.route.path : 'unmatched',
    statusCode: status,
    errorType: normalizedErrorType(error),
    ...(safePublicCode(error, status) ? { errorCode: safePublicCode(error, status) } : {}),
  };
  const writer = status >= 500 ? console.error : console.warn;
  writer(JSON.stringify(event));
};

const errorHandler = (error, req, res, _next) => {
  let status = Number(error?.status || error?.statusCode || 500);
  if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;
  let message = typeof error?.message === 'string' ? error.message : 'Request failed.';

  if (error?.name === 'ValidationError') {
    status = 400;
    message = "We couldn't process your request. Please check your inputs and try again.";
  } else if (error?.name === 'CastError') {
    status = 400;
    message = 'One or more request parameters were not in the expected format.';
  } else if (error?.name === 'MongoServerError' || error?.code === 11000) {
    status = 409;
    message = 'A database conflict occurred. The resource may already exist.';
  } else if (status >= 500) {
    message = 'Something went wrong. Please try again.';
  }

  writeErrorEvent(error, req, status);

  const code = safePublicCode(error, status);
  const payload = {
    message,
    ...(code ? { code } : {}),
    ...(safeRequestId(req) ? { requestId: safeRequestId(req) } : {}),
  };
  if (code?.startsWith('MULTIPLAYER_')) {
    payload.error = {
      code,
      message,
      retryable: Boolean(error.retryable),
      ...(error.details ? { details: error.details } : {}),
    };
  }

  return res.status(status).json(payload);
};

module.exports = { errorHandler, handleValidation, notFound, writeErrorEvent };
