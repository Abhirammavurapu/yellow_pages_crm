const Activity = require('../models/Activity');

/**
 * Log an immutable activity record
 */
const logActivity = async ({
  actor = null,
  actorName = null,
  actorRole = null,
  action,
  entityType,
  entityId,
  leadId = null,
  previousValue = null,
  newValue = null,
  metadata = {}
}) => {
  try {
    const activity = await Activity.create({
      actor: actor
        ? actor._id || actor
        : null,

      actorName:
        actorName ||
        actor?.name ||
        'System',

      actorRole:
        actorRole ||
        actor?.role ||
        'SYSTEM',

      action,
      entityType,
      entityId,
      leadId,
      previousValue,
      newValue,
      metadata,
      timestamp: new Date()
    });

    return activity;

  } catch (err) {
    console.error(
      'Failed to log activity:',
      err.message
    );

    // Do not stop the main CRM operation
    return null;
  }
};

module.exports = {
  logActivity
};