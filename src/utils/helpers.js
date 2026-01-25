/**
 * Helper Utility Functions
 * Reusable functions across the application
 */

/**
 * Format success response
 */
export const successResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta,
  };
};

/**
 * Format error response
 */
export const errorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Sanitize user object (remove sensitive data)
 */
export const sanitizeUser = (user) => {
  const userObj = user?.toObject ? user.toObject() : user;
  const { password, __v, ...sanitized } = userObj;
  return sanitized;
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Calculate date range for reports
 */
export const getDateRange = (type, year, quarter = null, month = null) => {
  let startDate;
  let endDate;

  switch (type) {
    case 'annual':
      startDate = new Date(year, 0, 1); // January 1st
      endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st
      break;

    case 'quarterly':
      if (!quarter || quarter < 1 || quarter > 4) {
        throw new Error('Valid quarter (1-4) is required for quarterly reports');
      }
      const quarterStartMonth = (quarter - 1) * 3;
      startDate = new Date(year, quarterStartMonth, 1);
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59);
      break;

    case 'monthly':
      if (!month || month < 1 || month > 12) {
        throw new Error('Valid month (1-12) is required for monthly reports');
      }
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
      break;

    default:
      throw new Error('Invalid report type');
  }

  return { startDate, endDate };
};

/**
 * Round number to specified decimal places
 */
export const roundToDecimal = (number, decimals = 2) => {
  return (
    Math.round(number * Math.pow(10, decimals)) /
    Math.pow(10, decimals)
  );
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (part, total, decimals = 2) => {
  if (total === 0) return 0;
  return roundToDecimal((part / total) * 100, decimals);
};

/**
 * Extract IP address from request
 */
export const getClientIp = (req) => {
  return (
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    'unknown'
  );
};

/**
 * Extract user agent from request
 */
export const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Sleep function for testing/delays
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate random string (for tokens, etc.)
 */
export const generateRandomString = (length = 32) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return result;
};
