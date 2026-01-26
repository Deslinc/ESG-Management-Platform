import Joi from 'joi';
import { HTTP_STATUS } from '../utils/constants.js';
import { errorResponse } from '../utils/helpers.js';

/**
 * Validation Schemas
 */
export const schemas = {
  // User Registration
  userRegistration: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).max(100).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    }),
    role: Joi.string()
      .valid('administrator', 'esg_analyst', 'auditor')
      .default('esg_analyst'),
    organization: Joi.string().min(2).max(200).required().messages({
      'any.required': 'Organization name is required'
    })
  }),

  // User Login
  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // ESG Record Creation
  esgRecordCreate: Joi.object({
    organization: Joi.string().required(),
    reportingPeriod: Joi.object({
      year: Joi.number().integer().min(2000).max(2100).required(),
      quarter: Joi.number().integer().min(1).max(4).optional(),
      month: Joi.number().integer().min(1).max(12).optional()
    }).required(),

    environmental: Joi.object({
      scope1Emissions: Joi.number().min(0).default(0),
      scope2Emissions: Joi.number().min(0).default(0),
      scope3Emissions: Joi.number().min(0).default(0),
      energyConsumption: Joi.number().min(0).default(0),
      renewableEnergyPercentage: Joi.number().min(0).max(100).default(0),
      waterUsage: Joi.number().min(0).default(0),
      wasteGenerated: Joi.number().min(0).default(0),
      wasteRecycled: Joi.number().min(0).default(0)
    }).optional(),

    social: Joi.object({
      totalEmployees: Joi.number().integer().min(0).default(0),
      diversityRatio: Joi.number().min(0).max(100).default(0),
      femaleEmployeesPercentage: Joi.number().min(0).max(100).default(0),
      healthAndSafetyIncidents: Joi.number().integer().min(0).default(0),
      trainingHoursPerEmployee: Joi.number().min(0).default(0),
      employeeTurnoverRate: Joi.number().min(0).max(100).default(0),
      communityInvestment: Joi.number().min(0).default(0)
    }).optional(),

    governance: Joi.object({
      boardIndependence: Joi.number().min(0).max(100).default(0),
      femaleDirectorsPercentage: Joi.number().min(0).max(100).default(0),
      complianceStatus: Joi.string()
        .valid(
          'compliant',
          'partially_compliant',
          'non_compliant',
          'under_review'
        )
        .default('under_review'),
      ethicsPolicyConfirmed: Joi.boolean().default(false),
      whistleblowerCases: Joi.number().integer().min(0).default(0),
      dataBreaches: Joi.number().integer().min(0).default(0),
      auditFrequency: Joi.string()
        .valid('monthly', 'quarterly', 'semi_annual', 'annual')
        .default('annual')
    }).optional()
  }),

  // Report Generation
  reportGenerate: Joi.object({
    reportTitle: Joi.string().max(200).required(),
    organization: Joi.string().required(),
    reportType: Joi.string()
      .valid('annual', 'quarterly', 'monthly', 'custom')
      .required(),
    year: Joi.number().integer().min(2000).max(2100).required(),
    quarter: Joi.number().integer().min(1).max(4).optional(),
    month: Joi.number().integer().min(1).max(12).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
};

/**
 * Generic validation middleware
 */
export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      console.error(`Validation schema '${schemaName}' not found`);
      return next();
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse('Validation failed', errors)
      );
    }

    req.body = value;
    next();
  };
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse(`Invalid ${paramName} format`)
      );
    }

    next();
  };
};
