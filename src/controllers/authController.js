import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auditService from '../services/auditService.js';

import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '../utils/constants.js';

import {
  successResponse,
  errorResponse,
  sanitizeUser
} from '../utils/helpers.js';

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        errorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS)
      );
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      organization
    });

    // Generate token
    const token = generateToken(user._id);

    // Log user creation in audit
    await auditService.logUserCreated(
      user._id,
      user._id,
      { email, role, organization },
      req
    );

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          user: sanitizeUser(user),
          token
        },
        SUCCESS_MESSAGES.USER_CREATED
      )
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await auditService.logLogin(null, req, false, 'Invalid credentials');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS)
      );
    }

    // Check if user is active
    if (!user.isActive) {
      await auditService.logLogin(user._id, req, false, 'Account deactivated');
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse('Your account has been deactivated')
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await auditService.logLogin(user._id, req, false, 'Invalid password');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS)
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Log successful login
    await auditService.logLogin(user._id, req, true);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          user: sanitizeUser(user),
          token
        },
        SUCCESS_MESSAGES.LOGIN_SUCCESS
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.USER_NOT_FOUND)
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(user, 'Profile retrieved successfully')
    );
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, organization } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.USER_NOT_FOUND)
      );
    }

    if (name) user.name = name;
    if (organization) user.organization = organization;

    await user.save();

    // Log update
    await auditService.logUserUpdated(
      req.userId,
      user._id,
      { name, organization },
      req
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        sanitizeUser(user),
        SUCCESS_MESSAGES.USER_UPDATED
      )
    );
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Logout user (audit only)
 */
export const logout = async (req, res) => {
  try {
    await auditService.logLogout(req.userId, req);

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, SUCCESS_MESSAGES.LOGOUT_SUCCESS)
    );
  } catch (error) {
    console.error('Logout error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
  
};
export default {
  register,
  login,
  getProfile,
  updateProfile,
  logout
};
