import { HTTP_STATUS } from '../utils/constants.js';
import { errorResponse } from '../utils/helpers.js';

/**
 * Global Error Handler Middleware
 * Catches and formats all errors in the application
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      errorResponse('Validation failed', errors)
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(HTTP_STATUS.CONFLICT).json(
      errorResponse(`A record with this ${field} already exists`)
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      errorResponse('Invalid ID format')
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse('Invalid token')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse('Token has expired')
    );
  }

  // Default to 500 server error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'An unexpected error occurred';

  return res.status(statusCode).json(
    errorResponse(
      message,
      process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
    )
  );
};

/**
 * Handle 404 Not Found
 */
export const notFound = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json(
    errorResponse(`Route ${req.originalUrl} not found`)
  );
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
