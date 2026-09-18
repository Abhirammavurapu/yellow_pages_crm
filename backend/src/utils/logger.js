/**
 * Structured Logger for Yellow Pages CRM
 * Redacts sensitive keys such as passwords, tokens, auth headers
 */

const SENSITIVE_KEYS = ['password', 'passwordhash', 'token', 'jwt', 'secret', 'authorization'];

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      meta: sanitize(meta)
    }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      meta: sanitize(meta)
    }));
  },
  error: (message, error = {}) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : sanitize(error)
    }));
  }
};

module.exports = logger;
