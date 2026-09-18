const AuditLog = require('../models/AuditLog');

/**
 * Log an immutable audit record
 */
const logAudit = async ({
  actor = null,
  action,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = '',
  userAgent = '',
  metadata = {}
}) => {
  try {
    const auditLog = await AuditLog.create({
      actor: actor
        ? actor._id || actor
        : null,

      actorName:
        actor?.name || 'System',

      actorRole:
        actor?.role || 'SYSTEM',

      action,
      entity,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      metadata,
      timestamp: new Date()
    });

    return auditLog;

  } catch (err) {
    console.error(
      'Failed to log audit:',
      err.message
    );

    // Do not break the main CRM operation
    return null;
  }
};

module.exports = {
  logAudit
};