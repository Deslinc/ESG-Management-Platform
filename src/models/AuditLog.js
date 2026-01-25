import mongoose from 'mongoose';

/**
 * Audit Log Schema
 * Immutable records of all critical system actions
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'ESG_RECORD_CREATED',
        'ESG_RECORD_UPDATED',
        'ESG_RECORD_DELETED',
        'ESG_RECORD_SUBMITTED',
        'ESG_RECORD_APPROVED',
        'ESG_RECORD_REJECTED',
        'REPORT_GENERATED',
        'REPORT_PUBLISHED',
        'REPORT_DELETED',
        'SETTINGS_CHANGED',
        'PERMISSION_CHANGED',
        'DATA_EXPORT',
        'UNAUTHORIZED_ACCESS_ATTEMPT',
      ],
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    targetResource: {
      resourceType: {
        type: String,
        enum: ['User', 'ESGRecord', 'Report', 'System'],
        required: true,
      },
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    success: {
      type: Boolean,
      default: true,
    },

    errorMessage: {
      type: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true, // Cannot be changed after creation
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt, no updates
  }
);

// Prevent updates and deletes — audit logs are immutable
auditLogSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Audit logs cannot be updated'));
});

auditLogSchema.pre('findOneAndDelete', function (next) {
  next(new Error('Audit logs cannot be deleted'));
});

auditLogSchema.pre('remove', function (next) {
  next(new Error('Audit logs cannot be deleted'));
});

// Indexes for efficient querying
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({
  'targetResource.resourceType': 1,
  'targetResource.resourceId': 1,
});
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
