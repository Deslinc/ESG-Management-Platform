import express from 'express';

import reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validator.js';
import { adminOrAnalyst, adminOnly, anyRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/reports/generate
 * @desc    Generate a new ESG report
 * @access  Private (Administrator, ESG Analyst)
 */
router.post(
  '/generate',
  authenticate,
  adminOrAnalyst,
  validate('reportGenerate'),
  asyncHandler(reportController.generateReport)
);

/**
 * @route   GET /api/reports
 * @desc    Get all reports with filters
 * @access  Private (All roles)
 */
router.get(
  '/',
  authenticate,
  anyRole,
  asyncHandler(reportController.getReports)
);

/**
 * @route   GET /api/reports/statistics
 * @desc    Get report statistics
 * @access  Private (All roles)
 */
router.get(
  '/statistics',
  authenticate,
  anyRole,
  asyncHandler(reportController.getReportStatistics)
);

/**
 * @route   GET /api/reports/:id
 * @desc    Get single report by ID
 * @access  Private (All roles)
 */
router.get(
  '/:id',
  authenticate,
  anyRole,
  validateObjectId('id'),
  asyncHandler(reportController.getReportById)
);

/**
 * @route   PUT /api/reports/:id/status
 * @desc    Update report status
 * @access  Private (Administrator, ESG Analyst)
 */
router.put(
  '/:id/status',
  authenticate,
  adminOrAnalyst,
  validateObjectId('id'),
  asyncHandler(reportController.updateReportStatus)
);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete report
 * @access  Private (Administrator only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  asyncHandler(reportController.deleteReport)
);

export default router;
