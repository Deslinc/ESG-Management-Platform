import express from 'express';

import userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validator.js';
import { adminOnly, anyRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Administrator only)
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  asyncHandler(userController.getAllUsers)
);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Administrator only)
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  validate('userRegistration'),
  asyncHandler(userController.createUser)
);

/**
 * @route   GET /api/users/audit-logs
 * @desc    Get audit logs
 * @access  Private (Administrator, Auditor)
 */
router.get(
  '/audit-logs',
  authenticate,
  anyRole,
  asyncHandler(userController.getAuditLogs)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Administrator only)
 */
router.get(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  asyncHandler(userController.getUserById)
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Administrator only)
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  asyncHandler(userController.updateUser)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Administrator only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  asyncHandler(userController.deleteUser)
);

export default router;
