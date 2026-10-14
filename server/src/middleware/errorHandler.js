/**
 * Global Error Handler Middleware
 * Guarantees centralized, sanitized error responses across the entire application.
 * Never exposes raw exceptions, database internals, stack traces, or paths to clients.
 */
export function errorHandler(err, req, res, next) {
  // Always log full error details on the server for diagnostics
  console.error('[API Error]', {
    method: req.method,
    path: req.originalUrl || req.url,
    errorName: err?.name,
    message: err?.message,
    stack: err?.stack,
  });

  // 1. Malformed JSON request bodies from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request format.',
      code: 'INVALID_REQUEST',
    });
  }

  // 2. Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = err.errors
      ? Object.values(err.errors).map((val) => val.message)
      : ['Validation failed.'];
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      code: 'VALIDATION_ERROR',
      errors: messages,
    });
  }

  // 3. Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A resource with this unique property already exists.',
      code: 'DUPLICATE_RESOURCE',
    });
  }

  // 4. Mongoose CastError (invalid ObjectId or type casting failure)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier format.',
      code: 'INVALID_ID',
    });
  }

  // 5. Multer file upload errors
  if (err.name === 'MulterError' || (err.code && typeof err.code === 'string' && err.code.startsWith('LIMIT_'))) {
    const isSize = err.code === 'LIMIT_FILE_SIZE';
    return res.status(400).json({
      success: false,
      message: isSize ? 'File size exceeds maximum permitted limit.' : 'File upload validation failed.',
      code: 'FILE_UPLOAD_ERROR',
    });
  }

  // 6. Explicit Operational / Application Errors (AppError)
  if (err.isOperational && err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Invalid request.',
      code: err.code || 'BAD_REQUEST',
    });
  }

  // 7. System / Database crash errors (TypeError, MongoServerError, BSONError, etc.)
  // These must NEVER leak internals, table names, or error messages to the client
  const isSystemCrash =
    err instanceof TypeError ||
    err instanceof ReferenceError ||
    err.name === 'MongoServerError' ||
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'BSONError' ||
    (err.statusCode && err.statusCode >= 500);

  if (isSystemCrash) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }

  // 8. Domain business logic errors (thrown with new Error(...) in auction / team workflows)
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 400);
  if (statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Invalid request.',
      code: err.code || 'INVALID_REQUEST',
    });
  }

  // Fallback for any unhandled 500 condition
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

/**
 * 404 Handler for undefined API routes
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'Requested route was not found.',
    code: 'NOT_FOUND',
  });
}
