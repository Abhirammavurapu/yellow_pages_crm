const Lead = require('../models/Lead');
const {
  DEFAULT_LOCK_DURATION_MINUTES
} = require('../config/constants');

const LOCK_DURATION_MS =
  (parseInt(
    process.env.LOCK_DURATION_MINUTES,
    10
  ) || DEFAULT_LOCK_DURATION_MINUTES) *
  60 *
  1000;


/**
 * Atomically acquire a calling lock on a lead
 */
async function acquireLock(
  leadId,
  employeeId
) {
  const now = new Date();

  const expiresAt = new Date(
    now.getTime() + LOCK_DURATION_MS
  );

  const lead =
    await Lead.findOneAndUpdate(
      {
        _id: leadId,
        isDeleted: false,

        $or: [
          { 'lock.isLocked': false },
          { 'lock.isLocked': { $exists: false } },
          { 'lock.lockExpiresAt': { $lte: now } },
          { 'lock.lockedBy': employeeId }
        ]
      },
      {
        $set: {
          'lock.isLocked': true,
          'lock.lockedBy': employeeId,
          'lock.lockedAt': now,
          'lock.lockExpiresAt': expiresAt
        }
      },
      {
        new: true
      }
    )
      .populate(
        'lock.lockedBy',
        'name employeeId role'
      );

  if (!lead) {
    const currentLead =
      await Lead.findById(leadId)
        .populate(
          'lock.lockedBy',
          'name employeeId role'
        );

    if (!currentLead) {
      return {
        success: false,
        reason: 'NOT_FOUND',
        message: 'Lead not found'
      };
    }

    const lockedByEmployee =
      currentLead.lock?.lockedBy || null;

    const lockHolderName =
      lockedByEmployee?.name ||
      'Another employee';

    const expires =
      currentLead.lock?.lockExpiresAt ||
      null;

    return {
      success: false,
      reason: 'LOCKED',
      message:
        `This lead is currently being handled by ${lockHolderName}. ` +
        `Lock expires at ${
          expires
            ? new Date(expires).toLocaleTimeString()
            : 'soon'
        }.`,
      lockedBy: lockedByEmployee,
      lockExpiresAt: expires
    };
  }

  return {
    success: true,
    lead,
    lockExpiresAt: expiresAt
  };
}


/**
 * Release a lead lock
 */
async function releaseLock(
  leadId,
  employeeId,
  force = false
) {
  const query = {
    _id: leadId,
    isDeleted: false
  };

  if (!force) {
    query['lock.lockedBy'] =
      employeeId;
  }

  const updated =
    await Lead.findOneAndUpdate(
      query,
      {
        $set: {
          'lock.isLocked': false,
          'lock.lockedBy': null,
          'lock.lockedAt': null,
          'lock.lockExpiresAt': null
        }
      },
      {
        new: true
      }
    );

  return !!updated;
}


/**
 * Extend lock duration (heartbeat)
 */
async function renewLock(
  leadId,
  employeeId
) {
  const now = new Date();

  const expiresAt = new Date(
    now.getTime() + LOCK_DURATION_MS
  );

  const updated =
    await Lead.findOneAndUpdate(
      {
        _id: leadId,
        isDeleted: false,
        'lock.isLocked': true,
        'lock.lockedBy': employeeId
      },
      {
        $set: {
          'lock.lockExpiresAt':
            expiresAt
        }
      },
      {
        new: true
      }
    );

  if (!updated) {
    return {
      success: false
    };
  }

  return {
    success: true,
    lockExpiresAt: expiresAt
  };
}


module.exports = {
  acquireLock,
  releaseLock,
  renewLock
};