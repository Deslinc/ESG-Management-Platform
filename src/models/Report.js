import mongoose from 'mongoose';

/**
 * Report Schema
 * Stores generated ESG reports with aggregated data
 */
const reportSchema = new mongoose.Schema(
  {
    reportTitle: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      index: true,
    },

    reportType: {
      type: String,
      enum: ['annual', 'quarterly', 'monthly', 'custom'],
      required: [true, 'Report type is required'],
      default: 'quarterly',
    },

    reportingPeriod: {
      startDate: {
        type: Date,
        required: [true, 'Start date is required'],
      },
      endDate: {
        type: Date,
        required: [true, 'End date is required'],
      },
      year: {
        type: Number,
        required: true,
      },
    },

    // Aggregated Environmental Metrics
    environmentalSummary: {
      totalScope1Emissions: { type: Number, default: 0 },
      totalScope2Emissions: { type: Number, default: 0 },
      totalScope3Emissions: { type: Number, default: 0 },
      totalCarbonEmissions: { type: Number, default: 0 },
      averageRenewableEnergyPercentage: { type: Number, default: 0 },
      totalEnergyConsumption: { type: Number, default: 0 },
      totalWaterUsage: { type: Number, default: 0 },
      wasteRecyclingRate: { type: Number, default: 0 },
    },

    // Aggregated Social Metrics
    socialSummary: {
      averageDiversityRatio: { type: Number, default: 0 },
      totalHealthAndSafetyIncidents: { type: Number, default: 0 },
      averageTrainingHours: { type: Number, default: 0 },
      averageTurnoverRate: { type: Number, default: 0 },
      totalCommunityInvestment: { type: Number, default: 0 },
      averageFemaleEmployeesPercentage: { type: Number, default: 0 },
    },

    // Aggregated Governance Metrics
    governanceSummary: {
      averageBoardIndependence: { type: Number, default: 0 },
      complianceRate: { type: Number, default: 0 },
      totalWhistleblowerCases: { type: Number, default: 0 },
      totalDataBreaches: { type: Number, default: 0 },
      averageFemaleDirectorsPercentage: { type: Number, default: 0 },
    },

    // Overall ESG Score
    overallScore: {
      environmentalScore: { type: Number, min: 0, max: 100 },
      socialScore: { type: Number, min: 0, max: 100 },
      governanceScore: { type: Number, min: 0, max: 100 },
      totalScore: { type: Number, min: 0, max: 100 },
    },

    // References to ESG records included in this report
    includedRecords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ESGRecord',
      },
    ],

    // Report metadata
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['draft', 'finalized', 'published', 'archived'],
      default: 'draft',
    },

    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },

    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
reportSchema.index({ organization: 1, 'reportingPeriod.year': -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reportType: 1 });

// Virtual for report period duration
reportSchema.virtual('periodDuration').get(function () {
  if (this.reportingPeriod.startDate && this.reportingPeriod.endDate) {
    const diff =
      this.reportingPeriod.endDate - this.reportingPeriod.startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)); // days
  }
  return 0;
});

// Ensure virtuals are included in JSON
reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
