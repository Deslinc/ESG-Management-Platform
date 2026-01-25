/**
 * Application Constants
 * Centralized configuration values
 */

// User Roles
export const ROLES = {
  ADMINISTRATOR: 'administrator',
  ESG_ANALYST: 'esg_analyst',
  AUDITOR: 'auditor',
};

// ESG Record Status
export const ESG_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Report Status
export const REPORT_STATUS = {
  DRAFT: 'draft',
  FINALIZED: 'finalized',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

// Report Types
export const REPORT_TYPES = {
  ANNUAL: 'annual',
  QUARTERLY: 'quarterly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
};

// Audit Actions
export const AUDIT_ACTIONS = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  ESG_RECORD_CREATED: 'ESG_RECORD_CREATED',
  ESG_RECORD_UPDATED: 'ESG_RECORD_UPDATED',
  ESG_RECORD_DELETED: 'ESG_RECORD_DELETED',
  ESG_RECORD_SUBMITTED: 'ESG_RECORD_SUBMITTED',
  ESG_RECORD_APPROVED: 'ESG_RECORD_APPROVED',
  ESG_RECORD_REJECTED: 'ESG_RECORD_REJECTED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_PUBLISHED: 'REPORT_PUBLISHED',
  REPORT_DELETED: 'REPORT_DELETED',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  TOKEN_INVALID: 'Invalid or expired token',
  TOKEN_MISSING: 'No authentication token provided',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  RESOURCE_NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'An internal server error occurred',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  ESG_RECORD_CREATED: 'ESG record created successfully',
  ESG_RECORD_UPDATED: 'ESG record updated successfully',
  ESG_RECORD_DELETED: 'ESG record deleted successfully',
  ESG_RECORD_SUBMITTED: 'ESG record submitted successfully',
  ESG_RECORD_APPROVED: 'ESG record approved successfully',
  ESG_RECORD_REJECTED: 'ESG record rejected successfully',
  REPORT_GENERATED: 'Report generated successfully',
  REPORT_PUBLISHED: 'Report published successfully',
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};
