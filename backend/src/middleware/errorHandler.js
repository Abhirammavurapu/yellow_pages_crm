const logger = require('../utils/logger');
const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return error(res, 'Validation failed', 'VALIDATION_ERROR', 400, details);
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return error(res, `Duplicate entry for ${field}: '${err.keyValue[field]}'`, 'DUPLICATE_ENTRY', 409);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return error(res, `Invalid ID format for ${err.path}`, 'INVALID_ID', 400);
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected error occurred on the server'
    : err.message || 'Internal Server Error';

  return error(res, message, errorCode, statusCode);
};

module.exports = errorHandler;
