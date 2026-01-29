import User from '../models/User.js';
import auditService from '../services/auditService.js';

import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION
} from '../utils/constants.js';

import {
  successResponse,
  errorResponse,
  sanitizeUser,
  getPaginationMeta
} from '../utils/helpers.js';

/**
 * Get all users (Administrator only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      role,
      organization,
      isActive,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (organization) query.organization = organization;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        users,
        'Users retrieved successfully',
        getPaginationMeta(total, page, limit)
      )
    );
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get user by ID (Administrator only)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.USER_NOT_FOUND)
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(user, 'User retrieved successfully')
    );
  } catch (error) {
    console.error('Get user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Create a new user (Administrator only)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        errorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS)
      );
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      organization,
      createdBy: req.userId
    });

    await auditService.logUserCreated(
      req.userId,
      user._id,
      { email, role, organization },
      req
    );

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        sanitizeUser(user),
        SUCCESS_MESSAGES.USER_CREATED
      )
    );
  } catch (error) {
    console.error('Create user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Update user (Administrator only)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, organization, isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.USER_NOT_FOUND)
      );
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (organization) user.organization = organization;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await auditService.logUserUpdated(
      req.userId,
      user._id,
      { name, email, role, organization, isActive },
      req
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        sanitizeUser(user),
        SUCCESS_MESSAGES.USER_UPDATED
      )
    );
  } catch (error) {
    console.error('Update user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Delete user (Administrator only)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.userId.toString()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse('You cannot delete your own account')
      );
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.USER_NOT_FOUND)
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, SUCCESS_MESSAGES.USER_DELETED)
    );
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get audit logs (Auditor & Administrator)
 */
export const getAuditLogs = async (req, res) => {
  try {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const filters = {
      userId,
      action,
      resourceType,
      startDate,
      endDate
    };

    const result = await auditService.getAuditLogs(filters, page, limit);

    res.status(HTTP_STATUS.OK).json(
      successResponse(result.logs, 'Audit logs retrieved successfully', {
        pagination: result.pagination
      })
    );
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};
