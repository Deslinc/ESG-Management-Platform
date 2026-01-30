import ESGRecord from '../models/ESGRecord.js';
import auditService from '../services/auditService.js';

import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  ROLES
} from '../utils/constants.js';

import {
  successResponse,
  errorResponse,
  getPaginationMeta
} from '../utils/helpers.js';

/**
 * Create a new ESG record
 */
export const createESGRecord = async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      submittedBy: req.userId
    };

    const esgRecord = await ESGRecord.create(recordData);

    // Log creation
    await auditService.logESGRecordCreated(
      req.userId,
      esgRecord._id,
      {
        organization: esgRecord.organization,
        year: esgRecord.reportingPeriod.year
      },
      req
    );

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(esgRecord, SUCCESS_MESSAGES.ESG_RECORD_CREATED)
    );
  } catch (error) {
    console.error('Create ESG record error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get all ESG records with filters and pagination
 */
export const getESGRecords = async (req, res) => {
  try {
    const {
      organization,
      year,
      status,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const query = {};

    // Access control
    if (req.user.role !== ROLES.ADMINISTRATOR) {
      query.organization = req.user.organization;
    } else if (organization) {
      query.organization = organization;
    }

    if (year) {
      query['reportingPeriod.year'] = parseInt(year, 10);
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [records, total] = await Promise.all([
      ESGRecord.find(query)
        .populate('submittedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      ESGRecord.countDocuments(query)
    ]);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        records,
        'ESG records retrieved successfully',
        getPaginationMeta(total, page, limit)
      )
    );
  } catch (error) {
    console.error('Get ESG records error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get single ESG record by ID
 */
export const getESGRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ESGRecord.findById(id)
      .populate('submittedBy', 'name email role')
      .populate('reviewedBy', 'name email role');

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    if (
      req.user.role !== ROLES.ADMINISTRATOR &&
      record.organization !== req.user.organization
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(record, 'ESG record retrieved successfully')
    );
  } catch (error) {
    console.error('Get ESG record error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Update ESG record
 */
export const updateESGRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ESGRecord.findById(id);

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    if (req.user.role === ROLES.AUDITOR) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse('Auditors cannot modify ESG records')
      );
    }

    if (
      req.user.role !== ROLES.ADMINISTRATOR &&
      record.organization !== req.user.organization
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
      );
    }

    if (record.status === 'approved' && req.user.role !== ROLES.ADMINISTRATOR) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse('Cannot update approved records')
      );
    }

    const allowedUpdates = [
      'environmental',
      'social',
      'governance',
      'status',
      'reviewNotes'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });

    await record.save();

    // Log update
    await auditService.logESGRecordUpdated(
      req.userId,
      record._id,
      { status: record.status },
      req
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(record, SUCCESS_MESSAGES.ESG_RECORD_UPDATED)
    );
  } catch (error) {
    console.error('Update ESG record error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Submit ESG record for review
 */
export const submitESGRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ESGRecord.findById(id);

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    if (
      req.user.role !== ROLES.ADMINISTRATOR &&
      record.organization !== req.user.organization
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
      );
    }

    if (record.status !== 'draft') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse('Only draft records can be submitted')
      );
    }

    record.status = 'submitted';
    record.submittedAt = new Date();
    await record.save();

    await auditService.logESGRecordSubmitted(req.userId, record._id, req);

    res.status(HTTP_STATUS.OK).json(
      successResponse(record, SUCCESS_MESSAGES.ESG_RECORD_SUBMITTED)
    );
  } catch (error) {
    console.error('Submit ESG record error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Approve ESG record
 */
export const approveESGRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    const record = await ESGRecord.findById(id);

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    if (!['submitted', 'under_review'].includes(record.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse('Only submitted or under review records can be approved')
      );
    }

    record.status = 'approved';
    record.reviewedBy = req.userId;
    record.approvedAt = new Date();

    if (reviewNotes) {
      record.reviewNotes = reviewNotes;
    }

    await record.save();

    await auditService.logESGRecordApproved(req.userId, record._id, req);

    res.status(HTTP_STATUS.OK).json(
      successResponse(record, SUCCESS_MESSAGES.ESG_RECORD_APPROVED)
    );
  } catch (error) {
    console.error('Approve ESG record error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Delete ESG record (Administrator only)
 */
export const deleteESGRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ESGRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, SUCCESS_MESSAGES.ESG_RECORD_DELETED)
    );
  } catch (error) {
    console.error('Delete ESG record error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};
export default {
  createESGRecord,
  getESGRecords,
  getESGRecordById,
  updateESGRecord,
  submitESGRecord,
  approveESGRecord,
  deleteESGRecord
};
