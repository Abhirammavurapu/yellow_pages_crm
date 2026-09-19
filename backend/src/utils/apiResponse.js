/**
 * Standardized JSON API Response helper
 */

function success(res, data = null, message = 'Operation successful', statusCode = 200, meta = null) {
  const response = {
    success: true,
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

function error(res, message = 'An error occurred', errorCode = 'SERVER_ERROR', statusCode = 500, details = null) {
  const response = {
    success: false,
    message,
    errorCode
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  success,
  error
};
