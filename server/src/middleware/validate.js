import mongoose from 'mongoose';

/**
 * Validates that specified parameters match valid MongoDB ObjectId format
 */
export function validateObjectId(...paramNames) {
  return (req, res, next) => {
    for (const param of paramNames) {
      const val = req.params[param] || req.query[param] || req.body[param];
      if (val && !mongoose.Types.ObjectId.isValid(val)) {
        return res.status(400).json({
          success: false,
          message: `Invalid identifier format for parameter '${param}'.`,
          code: 'INVALID_ID',
        });
      }
    }
    next();
  };
}

/**
 * Sanitizes request body, query, and params by stripping NoSQL injection operators ($ and .)
 */
export function mongoSanitize(req, res, next) {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = sanitize(obj[i]);
      }
      return obj;
    }
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

/**
 * Enforces valid pagination limits and page numbers
 */
export function validatePagination(req, res, next) {
  if (req.query.limit !== undefined) {
    const parsedLimit = parseInt(req.query.limit, 10);
    req.query.limit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 200);
  }
  if (req.query.page !== undefined) {
    const parsedPage = parseInt(req.query.page, 10);
    req.query.page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  }
  next();
}

/**
 * Rejects disallowed HTTP methods
 */
export function rejectDisallowedMethods(allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']) {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({
        success: false,
        message: `HTTP method ${req.method} is not allowed.`,
        code: 'METHOD_NOT_ALLOWED',
      });
    }
    next();
  };
}
