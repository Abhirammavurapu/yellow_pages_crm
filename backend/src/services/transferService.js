const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const FollowUp = require('../models/FollowUp');
const TransferHistory = require('../models/TransferHistory');

const { logActivity } = require('./activityService');
const { logAudit } = require('./auditService');
const { EMPLOYEE_STATUS } = require('../config/constants');

/**
 * Core workload transfer execution logic.
 * Can be executed within a transaction session (replica set)
 * or standalone (single node / in-memory).
 */
async function executeTransferCore(
  {
    fromEmployeeId,
    toEmployeeId,
    performedBy,
    reason = 'Employee Resignation / Workload Rebalancing',
    leadIds = null,
    deactivateSourceEmployee = false
  },
  session = null
) {
  const sessionOpt = session ? { session } : {};

  // 1. Validate source employee
  let fromQuery = Employee.findById(fromEmployeeId);
  if (session) fromQuery = fromQuery.session(session);

  const fromEmployee = await fromQuery;

  if (!fromEmployee) {
    throw new Error('Source employee not found');
  }

  // 2. Validate target employee
  let toQuery = Employee.findById(toEmployeeId);
  if (session) toQuery = toQuery.session(session);

  const toEmployee = await toQuery;

  if (!toEmployee) {
    throw new Error('Target employee not found');
  }

  // 3. Prevent same employee transfer
  if (String(fromEmployeeId) === String(toEmployeeId)) {
    throw new Error('Cannot transfer workload to the same employee');
  }

  // 4. Target employee must be active
  if (toEmployee.status !== EMPLOYEE_STATUS.ACTIVE) {
    throw new Error(
      `Target employee is not active (Status: ${toEmployee.status})`
    );
  }

  // 5. Find leads belonging to source employee
  const leadQuery = {
    assignedTo: fromEmployee._id,
    isDeleted: false
  };

  if (Array.isArray(leadIds) && leadIds.length > 0) {
    leadQuery._id = { $in: leadIds };
  }

  let leadsFind = Lead.find(leadQuery).select(
    '_id businessName assignedTo'
  );

  if (session) {
    leadsFind = leadsFind.session(session);
  }

  const targetLeads = await leadsFind;

  // No leads to transfer
  if (targetLeads.length === 0) {
    if (deactivateSourceEmployee) {
      fromEmployee.status = EMPLOYEE_STATUS.RESIGNED;
      fromEmployee.resignationDate = new Date();
      fromEmployee.deactivatedDate = new Date();
      await fromEmployee.save(sessionOpt);
    }

    return {
      success: true,
      transferredCount: 0,
      followUpsUpdated: 0,
      message: 'No active leads found for the source employee'
    };
  }

  const affectedLeadIds = targetLeads.map((lead) => lead._id);
  const now = new Date();

  // 6. Assignment history entry
  const assignmentEntry = {
    fromEmployee: fromEmployee._id,
    toEmployee: toEmployee._id,
    assignedBy: performedBy._id,
    assignedAt: now,
    reason
  };

  // 7. Transfer leads in MongoDB
  await Lead.updateMany(
    {
      _id: { $in: affectedLeadIds },
      assignedTo: fromEmployee._id,
      isDeleted: false
    },
    {
      $set: {
        assignedTo: toEmployee._id,
        assignedTeam: toEmployee.teamId || null,
        assignedBy: performedBy._id,
        assignmentDate: now,
        'lock.isLocked': false,
        'lock.lockedBy': null,
        'lock.lockedAt': null,
        'lock.lockExpiresAt': null
      },
      $push: {
        assignmentHistory: assignmentEntry
      },
      $addToSet: {
        previousOwners: fromEmployee._id
      }
    },
    sessionOpt
  );

  // 8. Transfer pending follow-ups
  const followUpQuery = {
    assignedTo: fromEmployee._id,
    status: 'PENDING'
  };

  if (Array.isArray(leadIds) && leadIds.length > 0) {
    followUpQuery.leadId = { $in: affectedLeadIds };
  }

  const followUpUpdateResult = await FollowUp.updateMany(
    followUpQuery,
    {
      $set: {
        assignedTo: toEmployee._id
      }
    },
    sessionOpt
  );

  const followUpsUpdated =
    followUpUpdateResult.modifiedCount || 0;

  // 9. Create transfer history
  const transferRecords = await TransferHistory.create(
    [
      {
        fromEmployee: fromEmployee._id,
        fromEmployeeName: fromEmployee.name,
        toEmployee: toEmployee._id,
        toEmployeeName: toEmployee.name,
        transferredBy: performedBy._id,
        transferredByName: performedBy.name,
        transferDate: now,
        reason,
        leadCount: affectedLeadIds.length,
        leadsAffected: affectedLeadIds,
        followUpsAffectedCount: followUpsUpdated
      }
    ],
    sessionOpt
  );

  const transferRecord = transferRecords[0];

  // 10. Deactivate source employee
  if (deactivateSourceEmployee) {
    fromEmployee.status = EMPLOYEE_STATUS.RESIGNED;
    fromEmployee.resignationDate = now;
    fromEmployee.deactivatedDate = now;
    await fromEmployee.save(sessionOpt);
  }

  // 11. Activity & Audit logging
  await logActivity({
    actor: performedBy,
    actorName: performedBy.name,
    actorRole: performedBy.role,
    action: 'WORKLOAD_TRANSFERRED',
    entityType: 'EMPLOYEE',
    entityId: fromEmployee._id,
    previousValue: {
      assignedTo: fromEmployee.name,
      count: affectedLeadIds.length
    },
    newValue: {
      assignedTo: toEmployee.name,
      count: affectedLeadIds.length
    },
    metadata: {
      transferId: transferRecord._id,
      fromEmployeeId: fromEmployee._id,
      toEmployeeId: toEmployee._id,
      leadsCount: affectedLeadIds.length,
      followUpsCount: followUpsUpdated
    }
  });

  await logAudit({
    actor: performedBy,
    action: 'TRANSFER_EMPLOYEE_WORKLOAD',
    entity: 'EMPLOYEE',
    entityId: fromEmployee._id,
    oldValue: {
      employee: fromEmployee.name,
      leadsCount: affectedLeadIds.length
    },
    newValue: {
      newEmployee: toEmployee.name,
      leadsCount: affectedLeadIds.length
    },
    metadata: {
      transferredTo: toEmployee._id,
      reason,
      leadsCount: affectedLeadIds.length
    }
  });

  if (deactivateSourceEmployee) {
    await logAudit({
      actor: performedBy,
      action: 'DEACTIVATE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: fromEmployee._id,
      oldValue: EMPLOYEE_STATUS.ACTIVE,
      newValue: EMPLOYEE_STATUS.RESIGNED
    });
  }

  return {
    success: true,
    transferredCount: affectedLeadIds.length,
    followUpsUpdated,
    transferRecord
  };
}

/**
 * Execute employee workload transfer and preserve transfer history.
 * Automatically tries ACID transaction on replica sets and falls back
 * gracefully on standalone / in-memory MongoDB.
 */
async function transferEmployeeWorkload(params) {
  let session = null;

  try {
    session = await mongoose.startSession();
  } catch (err) {
    // startSession not supported on environment
  }

  if (session) {
    try {
      let result;

      await session.withTransaction(async () => {
        result = await executeTransferCore(params, session);
      });

      return result;
    } catch (err) {
      const isReplicaSetError =
        err.message?.includes(
          'Transaction numbers are only allowed on a replica set'
        ) ||
        err.code === 20 ||
        err.errorResponse?.code === 20;

      if (!isReplicaSetError) {
        throw err;
      }

      // Standalone/in-memory MongoDB:
      // gracefully proceed without transaction session
    } finally {
      await session.endSession();
    }
  }

  // Fallback for standalone / in-memory MongoDB
  return await executeTransferCore(params, null);
}

module.exports = {
  transferEmployeeWorkload
};