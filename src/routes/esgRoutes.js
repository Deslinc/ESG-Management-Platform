import express from 'express';

import esgController from '../controllers/esgController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validator.js';
import { adminOrAnalyst, adminOnly, anyRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/esg
 * @desc    Create a new ESG record
 * @access  Private (Administrator, ESG Analyst)
 */
router.post(
  '/',
  authenticate,
  adminOrAnalyst,
  validate('esgRecordCreate'),
  asyncHandler(esgController.createESGRecord)
);

/**
 * @route   GET /api/esg
 * @desc    Get all ESG records with filters
 * @access  Private (All roles)
 */
router.get(
  '/',
  authenticate,
  anyRole,
  asyncHandler(esgController.getESGRecords)
);

/**
 * @route   GET /api/esg/:id
 * @desc    Get single ESG record by ID
 * @access  Private (All roles)
 */
router.get(
  '/:id',
  authenticate,
  anyRole,
  validateObjectId('id'),
  asyncHandler(esgController.getESGRecordById)
);

/**
 * @route   PUT /api/esg/:id
 * @desc    Update ESG record
 * @access  Private (Administrator, ESG Analyst)
 */
router.put(
  '/:id',
  authenticate,
  adminOrAnalyst,
  validateObjectId('id'),
  asyncHandler(esgController.updateESGRecord)
);

/**
 * @route   POST /api/esg/:id/submit
 * @desc    Submit ESG record for review
 * @access  Private (Administrator, ESG Analyst)
 */
router.post(
  '/:id/submit',
  authenticate,
  adminOrAnalyst,
  validateObjectId('id'),
  asyncHandler(esgController.submitESGRecord)
);

/**
 * @route   POST /api/esg/:id/approve
 * @desc    Approve ESG record
 * @access  Private (Administrator, Auditor)
 */
router.post(
  '/:id/approve',
  authenticate,
  anyRole,
  validateObjectId('id'),
  asyncHandler(esgController.approveESGRecord)
);

/**
 * @route   DELETE /api/esg/:id
 * @desc    Delete ESG record
 * @access  Private (Administrator only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  asyncHandler(esgController.deleteESGRecord)
);

export default router;
