import Report from '../models/Report.js';
import ESGRecord from '../models/ESGRecord.js';
import esgCalculationService from '../services/esgCalculationService.js';
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
  getPaginationMeta,
  getDateRange
} from '../utils/helpers.js';

/**
 * Generate a new ESG report
 */
export const generateReport = async (req, res) => {
  try {
    const {
      reportTitle,
      organization,
      reportType,
      year,
      quarter,
      month,
      startDate,
      endDate
    } = req.body;

    let reportStartDate;
    let reportEndDate;

    if (reportType === 'custom' && startDate && endDate) {
      reportStartDate = new Date(startDate);
      reportEndDate = new Date(endDate);
    } else {
      const { startDate: start, endDate: end } =
        getDateRange(reportType, year, quarter, month);

      reportStartDate = start;
      reportEndDate = end;
    }

    const records = await esgCalculationService.getRecordsForPeriod(
      organization,
      reportStartDate,
      reportEndDate
    );

    if (records.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse('No approved ESG records found for this period')
      );
    }

    const environmentalSummary =
      esgCalculationService.aggregateEnvironmentalMetrics(records);

    const socialSummary =
      esgCalculationService.aggregateSocialMetrics(records);

    const governanceSummary =
      esgCalculationService.aggregateGovernanceMetrics(records);

    const overallScore =
      esgCalculationService.calculateOverallScores(
        environmentalSummary,
        socialSummary,
        governanceSummary
      );

    const report = await Report.create({
      reportTitle,
      organization,
      reportType,
      reportingPeriod: {
        startDate: reportStartDate,
        endDate: reportEndDate,
        year
      },
      environmentalSummary,
      socialSummary,
      governanceSummary,
      overallScore,
      includedRecords: records.map(r => r._id),
      generatedBy: req.userId
    });

    await auditService.logReportGenerated(
      req.userId,
      report._id,
      { organization, reportType, year },
      req
    );

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(report, SUCCESS_MESSAGES.REPORT_GENERATED)
    );
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(error.message || ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get all reports with filters and pagination
 */
export const getReports = async (req, res) => {
  try {
    const {
      organization,
      reportType,
      year,
      status,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const query = {};

    if (req.user.role !== ROLES.ADMINISTRATOR) {
      query.organization = req.user.organization;
    } else if (organization) {
      query.organization = organization;
    }

    if (reportType) {
      query.reportType = reportType;
    }

    if (year) {
      query['reportingPeriod.year'] = parseInt(year, 10);
    }

    if (status) {
      query.status = status;
    }

    const skip =
      (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Report.countDocuments(query)
    ]);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        reports,
        'Reports retrieved successfully',
        getPaginationMeta(total, page, limit)
      )
    );
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get single report by ID
 */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('generatedBy', 'name email role')
      .populate('includedRecords');

    if (!report) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    if (
      req.user.role !== ROLES.ADMINISTRATOR &&
      report.organization !== req.user.organization
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(report, 'Report retrieved successfully')
    );
  } catch (error) {
    console.error('Get report error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Update report status
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    if (
      req.user.role !== ROLES.ADMINISTRATOR &&
      report.organization !== req.user.organization
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        errorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
      );
    }

    if (status) {
      report.status = status;
      if (status === 'published') {
        report.publishedAt = new Date();
      }
    }

    if (notes) {
      report.notes = notes;
    }

    await report.save();

    res.status(HTTP_STATUS.OK).json(
      successResponse(report, 'Report updated successfully')
    );
  } catch (error) {
    console.error('Update report error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Delete report (Administrator only)
 */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND)
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, 'Report deleted successfully')
    );
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};

/**
 * Get report summary statistics
 */
export const getReportStatistics = async (req, res) => {
  try {
    const { organization } = req.query;

    const query = {};

    if (req.user.role !== ROLES.ADMINISTRATOR) {
      query.organization = req.user.organization;
    } else if (organization) {
      query.organization = organization;
    }

    const [
      totalReports,
      publishedReports,
      draftReports,
      reportsByType
    ] = await Promise.all([
      Report.countDocuments(query),
      Report.countDocuments({ ...query, status: 'published' }),
      Report.countDocuments({ ...query, status: 'draft' }),
      Report.aggregate([
        { $match: query },
        { $group: { _id: '$reportType', count: { $sum: 1 } } }
      ])
    ]);

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          totalReports,
          publishedReports,
          draftReports,
          reportsByType
        },
        'Statistics retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(ERROR_MESSAGES.INTERNAL_ERROR)
    );
  }
};
