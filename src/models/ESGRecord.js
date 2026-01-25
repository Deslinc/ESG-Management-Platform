import mongoose from 'mongoose';

/**
 * ESG Record Schema
 * Stores Environmental, Social, and Governance data
 */
const esgRecordSchema = new mongoose.Schema(
  {
    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      index: true,
    },

    reportingPeriod: {
      year: {
        type: Number,
        required: [true, 'Reporting year is required'],
        min: [2000, 'Year must be 2000 or later'],
        max: [2100, 'Year must be before 2100'],
      },
      quarter: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: false,
      },
      month: {
        type: Number,
        min: 1,
        max: 12,
        required: false,
      },
    },

    // Environmental Data
    environmental: {
      scope1Emissions: {
        type: Number,
        required: [true, 'Scope 1 emissions are required'],
        min: [0, 'Emissions cannot be negative'],
        default: 0,
      },
      scope2Emissions: {
        type: Number,
        required: [true, 'Scope 2 emissions are required'],
        min: [0, 'Emissions cannot be negative'],
        default: 0,
      },
      scope3Emissions: {
        type: Number,
        required: [true, 'Scope 3 emissions are required'],
        min: [0, 'Emissions cannot be negative'],
        default: 0,
      },
      totalCarbonEmissions: {
        type: Number,
        min: [0, 'Total emissions cannot be negative'],
      },
      energyConsumption: {
        type: Number,
        min: [0, 'Energy consumption cannot be negative'],
        default: 0,
      },
      renewableEnergyPercentage: {
        type: Number,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
        default: 0,
      },
      waterUsage: {
        type: Number,
        min: [0, 'Water usage cannot be negative'],
        default: 0,
      },
      wasteGenerated: {
        type: Number,
        min: [0, 'Waste generated cannot be negative'],
        default: 0,
      },
      wasteRecycled: {
        type: Number,
        min: [0, 'Waste recycled cannot be negative'],
        default: 0,
      },
    },

    // Social Data
    social: {
      totalEmployees: {
        type: Number,
        required: [true, 'Total employees is required'],
        min: [0, 'Employees cannot be negative'],
        default: 0,
      },
      diversityRatio: {
        type: Number,
        min: [0, 'Diversity ratio cannot be negative'],
        max: [100, 'Diversity ratio cannot exceed 100'],
        default: 0,
      },
      femaleEmployeesPercentage: {
        type: Number,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
        default: 0,
      },
      healthAndSafetyIncidents: {
        type: Number,
        min: [0, 'Incidents cannot be negative'],
        default: 0,
      },
      trainingHoursPerEmployee: {
        type: Number,
        min: [0, 'Training hours cannot be negative'],
        default: 0,
      },
      employeeTurnoverRate: {
        type: Number,
        min: [0, 'Turnover rate cannot be negative'],
        max: [100, 'Turnover rate cannot exceed 100'],
        default: 0,
      },
      communityInvestment: {
        type: Number,
        min: [0, 'Community investment cannot be negative'],
        default: 0,
      },
    },

    // Governance Data
    governance: {
      boardIndependence: {
        type: Number,
        min: [0, 'Board independence cannot be negative'],
        max: [100, 'Board independence cannot exceed 100'],
        default: 0,
      },
      femaleDirectorsPercentage: {
        type: Number,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
        default: 0,
      },
      complianceStatus: {
        type: String,
        enum: ['compliant', 'partially_compliant', 'non_compliant', 'under_review'],
        default: 'under_review',
      },
      ethicsPolicyConfirmed: {
        type: Boolean,
        default: false,
      },
      whistleblowerCases: {
        type: Number,
        min: [0, 'Cases cannot be negative'],
        default: 0,
      },
      dataBreaches: {
        type: Number,
        min: [0, 'Breaches cannot be negative'],
        default: 0,
      },
      auditFrequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'semi_annual', 'annual'],
        default: 'annual',
      },
    },

    // Metadata
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'draft',
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    reviewNotes: {
      type: String,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
    },

    submittedAt: {
      type: Date,
    },

    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total carbon emissions before saving
esgRecordSchema.pre('save', function (next) {
  if (this.environmental) {
    this.environmental.totalCarbonEmissions =
      (this.environmental.scope1Emissions || 0) +
      (this.environmental.scope2Emissions || 0) +
      (this.environmental.scope3Emissions || 0);
  }
  next();
});

// Indexes for efficient querying
esgRecordSchema.index({ organization: 1, 'reportingPeriod.year': -1 });
esgRecordSchema.index({ status: 1 });
esgRecordSchema.index({ submittedBy: 1 });

const ESGRecord = mongoose.model('ESGRecord', esgRecordSchema);

export default ESGRecord;

