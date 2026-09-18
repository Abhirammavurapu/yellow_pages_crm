const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const TransferHistory = require('../models/TransferHistory');

const {
  transferEmployeeWorkload
} = require('../services/transferService');

const {
  success,
  error
} = require('../utils/apiResponse');


/**
 * Get preview of workload before transferring
 */
const getTransferPreview = async (
  req,
  res,
  next
) => {
  try {
    const { employeeId } = req.params;

    const employee =
      await Employee.findById(employeeId)
        .select('-passwordHash');

    if (!employee) {
      return error(
        res,
        'Employee not found',
        'NOT_FOUND',
        404
      );
    }

    const [
      leadsCount,
      followUpsCount,
      sampleLeads
    ] = await Promise.all([

      Lead.countDocuments({
        assignedTo: employee._id,
        isDeleted: false
      }),

      FollowUp.countDocuments({
        assignedTo: employee._id,
        status: 'PENDING'
      }),

      Lead.find({
        assignedTo: employee._id,
        isDeleted: false
      })
        .select(
          'leadId businessName phoneNumbers city state currentStatus'
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    return success(
      res,
      {
        employee,
        leadsCount,
        followUpsCount,
        sampleLeads
      },
      'Workload preview retrieved'
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Execute workload transfer
 */
const executeTransfer = async (
  req,
  res,
  next
) => {
  try {

    const {
      fromEmployeeId,
      toEmployeeId,
      reason,
      deactivateSourceEmployee = false,
      leadIds = null
    } = req.body;


    if (
      !fromEmployeeId ||
      !toEmployeeId
    ) {
      return error(
        res,
        'Source and target employees are required',
        'MISSING_FIELDS',
        400
      );
    }


    if (
      String(fromEmployeeId) ===
      String(toEmployeeId)
    ) {
      return error(
        res,
        'Cannot transfer workload to the same employee',
        'INVALID_TRANSFER',
        400
      );
    }


    /* Verify source employee */

    const sourceEmployee =
      await Employee.findById(
        fromEmployeeId
      );

    if (!sourceEmployee) {
      return error(
        res,
        'Source employee not found',
        'SOURCE_EMPLOYEE_NOT_FOUND',
        404
      );
    }


    /* Verify target employee */

    const targetEmployee =
      await Employee.findById(
        toEmployeeId
      );

    if (!targetEmployee) {
      return error(
        res,
        'Target employee not found',
        'TARGET_EMPLOYEE_NOT_FOUND',
        404
      );
    }


    /* Validate leadIds */

    if (
      leadIds !== null &&
      !Array.isArray(leadIds)
    ) {
      return error(
        res,
        'leadIds must be an array',
        'INVALID_LEAD_IDS',
        400
      );
    }


    /* Execute transfer */

    const result =
      await transferEmployeeWorkload({
        fromEmployeeId,
        toEmployeeId,
        performedBy: req.user,
        reason:
          reason ||
          'Workload Rebalancing',
        leadIds,
        deactivateSourceEmployee:
          Boolean(
            deactivateSourceEmployee
          )
      });


    return success(
      res,
      result,
      `Successfully transferred ${result.transferredCount} leads and ${result.followUpsUpdated} follow-ups`
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Get transfer history
 */
const getTransferHistory = async (
  req,
  res,
  next
) => {
  try {

    const {
      page = 1,
      limit = 20
    } = req.query;


    const pageNumber =
      Math.max(
        parseInt(page, 10) || 1,
        1
      );

    const limitNumber =
      Math.min(
        Math.max(
          parseInt(limit, 10) || 20,
          1
        ),
        100
      );


    const skip =
      (pageNumber - 1) *
      limitNumber;


    const [
      transfers,
      total
    ] = await Promise.all([

      TransferHistory.find()
        .populate(
          'fromEmployee',
          'name employeeId role'
        )
        .populate(
          'toEmployee',
          'name employeeId role'
        )
        .populate(
          'transferredBy',
          'name employeeId role'
        )
        .sort({
          transferDate: -1
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      TransferHistory.countDocuments()
    ]);


    return success(
      res,
      transfers,
      'Transfer history retrieved',
      200,
      {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages:
          Math.ceil(
            total / limitNumber
          )
      }
    );

  } catch (err) {
    next(err);
  }
};


module.exports = {
  getTransferPreview,
  executeTransfer,
  getTransferHistory
};