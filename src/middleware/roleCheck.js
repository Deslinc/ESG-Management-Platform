import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../utils/constants.js';
import { errorResponse } from '../utils/helpers.js';
import auditService from '../services/auditService.js';

/**
 * Role-Based Access Control Middleware
 * Checks if user has required role(s) to access a resource
 */
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          errorResponse(ERROR_MESSAGES.UNAUTHORIZED)
        );
      }

      // Check if user's role is allowed
      const hasPermission = allowedRoles.includes(req.user.role);

      if (!hasPermission) {
        // Log unauthorized access attempt
        await auditService.logUnauthorizedAccess(
          req.user._id,
          req.path,
          req.method,
          req
        );

        return res.status(HTTP_STATUS.FORBIDDEN).json(
          errorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
        );
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
      );
    }
  };
};

/**
 * Administrator only access
 */
export const adminOnly = checkRole(ROLES.ADMINISTRATOR);

/**
 * Administrator and ESG Analyst access
 */
export const adminOrAnalyst = checkRole(
  ROLES.ADMINISTRATOR,
  ROLES.ESG_ANALYST
);

/**
 * All authenticated users (any role)
 */
export const anyRole = checkRole(
  ROLES.ADMINISTRATOR,
  ROLES.ESG_ANALYST,
  ROLES.AUDITOR
);

/**
 * Check if user can modify a specific resource
 * Administrators can modify anything, others only their own data
 */
export const canModifyResource = (resourceOwnerId) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          errorResponse(ERROR_MESSAGES.UNAUTHORIZED)
        );
      }

      const isAdmin = req.user.role === ROLES.ADMINISTRATOR;
      const isOwner = req.user._id.toString() === resourceOwnerId.toString();

      if (!isAdmin && !isOwner) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          errorResponse('You can only modify your own resources')
        );
      }

      next();
    } catch (error) {
      console.error('Resource modification check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
        errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
      );
    }
  };
};
