import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { errorResponse } from '../utils/helpers.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_MESSAGES.TOKEN_MISSING)
      );
    }

    // Extract token (remove "Bearer ")
    const token = authHeader.slice(7);

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_MESSAGES.TOKEN_MISSING)
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_MESSAGES.TOKEN_INVALID)
      );
    }

    // Find user by ID from token payload
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_MESSAGES.USER_NOT_FOUND)
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse('Your account has been deactivated')
      );
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but does not require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Invalid token is ignored for optional auth
        console.log('Optional auth: Invalid token');
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};
