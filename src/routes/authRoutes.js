import express from 'express';

import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate('userRegistration'),
  asyncHandler(authController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate('userLogin'),
  asyncHandler(authController.login)
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(authController.getProfile)
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  asyncHandler(authController.updateProfile)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (for audit logging)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

export default router;
