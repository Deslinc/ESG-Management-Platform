import AuditLog from '../models/AuditLog.js';
import { AUDIT_ACTIONS } from '../utils/constants.js';
import { getClientIp, getUserAgent } from '../utils/helpers.js';

/**
 * Audit Service
 * Handles all audit logging throughout the application
 */
class AuditService {
  /**
   * Create an audit log entry
   */
  async createLog({
    action,
    performedBy,
    resourceType,
    resourceId = null,
    details = {},
    success = true,
    errorMessage = null,
    ipAddress = null,
    userAgent = null
  }) {
    try {
      const auditLog = await AuditLog.create({
        action,
        performedBy,
        targetResource: {
          resourceType,
          resourceId
        },
        details,
        success,
        errorMessage,
        ipAddress,
        userAgent
      });

      return auditLog;
    } catch (error) {
      // Audit logging should never crash the app
      console.error('Failed to create audit log:', error.message);
      return null;
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId, req, success = true, errorMessage = null) {
    return this.createLog({
      action: AUDIT_ACTIONS.USER_LOGIN,
      performedBy: userId,
      resourceType: 'User',
      resourceId: userId,
      success,
      errorMessage,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log user logout
   */
  async logLogout(userId, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      performedBy: userId,
      resourceType: 'User',
      resourceId: userId,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log user creation
   */
  async logUserCreated(performedBy, newUserId, details, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.USER_CREATED,
      performedBy,
      resourceType: 'User',
      resourceId: newUserId,
      details,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log user update
   */
  async logUserUpdated(performedBy, userId, details, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.USER_UPDATED,
      performedBy,
      resourceType: 'User',
      resourceId: userId,
      details,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log ESG record creation
   */
  async logESGRecordCreated(performedBy, recordId, details, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.ESG_RECORD_CREATED,
      performedBy,
      resourceType: 'ESGRecord',
      resourceId: recordId,
      details,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log ESG record update
   */
  async logESGRecordUpdated(performedBy, recordId, details, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.ESG_RECORD_UPDATED,
      performedBy,
      resourceType: 'ESGRecord',
      resourceId: recordId,
      details,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log ESG record submission
   */
  async logESGRecordSubmitted(performedBy, recordId, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.ESG_RECORD_SUBMITTED,
      performedBy,
      resourceType: 'ESGRecord',
      resourceId: recordId,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log ESG record approval
   */
  async logESGRecordApproved(performedBy, recordId, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.ESG_RECORD_APPROVED,
      performedBy,
      resourceType: 'ESGRecord',
      resourceId: recordId,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log report generation
   */
  async logReportGenerated(performedBy, reportId, details, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.REPORT_GENERATED,
      performedBy,
      resourceType: 'Report',
      resourceId: reportId,
      details,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(userId, path, method, req) {
    return this.createLog({
      action: AUDIT_ACTIONS.UNAUTHORIZED_ACCESS_ATTEMPT,
      performedBy: userId,
      resourceType: 'System',
      details: { path, method },
      success: false,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const query = {};

      if (filters.userId) {
        query.performedBy = filters.userId;
      }

      if (filters.action) {
        query.action = filters.action;
      }

      if (filters.resourceType) {
        query['targetResource.resourceType'] = filters.resourceType;
      }

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .populate('performedBy', 'name email role')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      throw error;
    }
  }
}

export default new AuditService();
