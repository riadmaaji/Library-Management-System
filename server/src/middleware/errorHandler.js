const {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} = require('../utils/AppError');

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development' && err?.stack) {
    console.error(err.stack);
  }

  let statusCode = 500;
  let message = 'Something went wrong.';
  let errors;

  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  }

  const responseBody = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    responseBody.errors = errors;
  }

  res.status(statusCode).json(responseBody);
}

module.exports = errorHandler;
