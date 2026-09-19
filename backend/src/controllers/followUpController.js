const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const { success, error } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { FOLLOW_UP_STATUS, ROLES } = require('../config/constants');


/**
 * GET FOLLOW-UPS
 * Reads follow-ups from MongoDB
 */
const getFollowUps = async (req, res, next) => {
  try {
    const {
      type = 'all',
      status,
      assignedTo,
      page = 1,
      limit = 25
    } = req.query;

    const pageNumber = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(
        parseInt(limit, 10) || 25,
        1
      ),
      100
    );

    const query = {};

    // Employees can only see their own follow-ups
    const employeeRoles = [
      ROLES.EMPLOYEE,
      ROLES.TELECALLER,
      ROLES.BDE
    ];

    if (employeeRoles.includes(req.user.role)) {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    }

    // Start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // End of today
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Today
    if (type === 'today') {
      query.followUpDate = {
        $gte: startOfToday,
        $lte: endOfToday
      };

      if (!status) {
        query.status = FOLLOW_UP_STATUS.PENDING;
      }
    }

    // Overdue
    else if (type === 'overdue') {
      query.followUpDate = {
        $lt: startOfToday
      };

      query.status = FOLLOW_UP_STATUS.PENDING;
    }

    // Upcoming
    else if (type === 'upcoming') {
      query.followUpDate = {
        $gt: endOfToday
      };

      if (!status) {
        query.status = FOLLOW_UP_STATUS.PENDING;
      }
    }

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // GET DATA FROM MONGODB
    const [
      followUps,
      total
    ] = await Promise.all([
      FollowUp.find(query)
        .populate(
          'leadId',
          'businessName ownerName phoneNumbers city state currentStatus priority'
        )
        .populate(
          'assignedTo',
          'name employeeId role'
        )
        .populate(
          'createdBy',
          'name employeeId'
        )
        .sort({
          followUpDate: 1
        })
        .skip(skip)
        .limit(limitNumber),

      FollowUp.countDocuments(query)
    ]);

    // Summary filters
    const employeeFilter =
      employeeRoles.includes(req.user.role)
        ? {
            assignedTo: req.user._id
          }
        : assignedTo
          ? {
              assignedTo
            }
          : {};

    const [
      todayCount,
      overdueCount,
      upcomingCount
    ] = await Promise.all([
      FollowUp.countDocuments({
        ...employeeFilter,
        status:
          FOLLOW_UP_STATUS.PENDING,
        followUpDate: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      }),

      FollowUp.countDocuments({
        ...employeeFilter,
        status:
          FOLLOW_UP_STATUS.PENDING,
        followUpDate: {
          $lt: startOfToday
        }
      }),

      FollowUp.countDocuments({
        ...employeeFilter,
        status:
          FOLLOW_UP_STATUS.PENDING,
        followUpDate: {
          $gt: endOfToday
        }
      })
    ]);

    return success(
      res,
      followUps,
      'Follow-ups retrieved',
      200,
      {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages:
          Math.ceil(
            total / limitNumber
          ),
        counts: {
          today: todayCount,
          overdue: overdueCount,
          upcoming: upcomingCount
        }
      }
    );

  } catch (err) {
    next(err);
  }
};


/**
 * CREATE FOLLOW-UP
 *
 * NEW FOLLOW-UP IS SAVED IN MONGODB
 */
const createFollowUp = async (
  req,
  res,
  next
) => {
  try {
    const {
      leadId,
      followUpDate,
      followUpTime,
      notes,
      assignedTo
    } = req.body;

    // Validate required fields
    if (!leadId || !followUpDate) {
      return error(
        res,
        'Lead ID and follow-up date are required',
        'MISSING_FIELDS',
        400
      );
    }

    // Find lead from MongoDB
    const lead =
      await Lead.findById(
        leadId
      );

    if (
      !lead ||
      lead.isDeleted
    ) {
      return error(
        res,
        'Lead not found',
        'NOT_FOUND',
        404
      );
    }

    // Validate date
    const parsedDate =
      new Date(followUpDate);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return error(
        res,
        'Invalid follow-up date',
        'INVALID_DATE',
        400
      );
    }

    // Decide assigned employee
    const targetEmployeeId =
      assignedTo ||
      lead.assignedTo ||
      req.user._id;

    /*
     * ==========================================
     * SAVE NEW FOLLOW-UP TO MONGODB
     * ==========================================
     */
    const followUp =
      await FollowUp.create({
        leadId:
          lead._id,

        assignedTo:
          targetEmployeeId,

        createdBy:
          req.user._id,

        createdByNameSnapshot:
          req.user.name,

        followUpDate:
          parsedDate,

        followUpTime:
          followUpTime ||
          '10:00 AM',

        notes:
          notes || '',

        status:
          FOLLOW_UP_STATUS.PENDING
      });

    /*
     * ==========================================
     * UPDATE LEAD IN MONGODB
     * ==========================================
     */
    lead.nextFollowUpDate =
      parsedDate;

    await lead.save();

    // Activity log
    await logActivity({
      actor: req.user,

      action:
        'FOLLOW_UP_CREATED',

      entityType:
        'FOLLOW_UP',

      entityId:
        followUp._id,

      leadId:
        lead._id,

      newValue: {
        followUpDate:
          parsedDate,

        notes:
          notes || ''
      }
    });

    return success(
      res,
      followUp,
      'Follow-up created successfully',
      201
    );

  } catch (err) {
    next(err);
  }
};


/**
 * COMPLETE FOLLOW-UP
 *
 * Updates the MongoDB document
 */
const completeFollowUp = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const { notes } =
      req.body;

    // Find follow-up from MongoDB
    const followUp =
      await FollowUp.findById(
        id
      );

    if (!followUp) {
      return error(
        res,
        'Follow-up not found',
        'NOT_FOUND',
        404
      );
    }

    // Don't complete twice
    if (
      followUp.status ===
      FOLLOW_UP_STATUS.COMPLETED
    ) {
      return error(
        res,
        'Follow-up is already completed',
        'ALREADY_COMPLETED',
        400
      );
    }

    followUp.status =
      FOLLOW_UP_STATUS.COMPLETED;

    followUp.completedAt =
      new Date();

    followUp.completedBy =
      req.user._id;

    if (notes) {
      followUp.notes =
        `${followUp.notes || ''}\n[Completed note]: ${notes}`;
    }

    /*
     * ==========================================
     * SAVE UPDATED FOLLOW-UP TO MONGODB
     * ==========================================
     */
    await followUp.save();

    // Activity log
    await logActivity({
      actor: req.user,

      action:
        'FOLLOW_UP_COMPLETED',

      entityType:
        'FOLLOW_UP',

      entityId:
        followUp._id,

      leadId:
        followUp.leadId,

      newValue: {
        status:
          FOLLOW_UP_STATUS.COMPLETED,

        completedAt:
          followUp.completedAt
      }
    });

    return success(
      res,
      followUp,
      'Follow-up marked as completed'
    );

  } catch (err) {
    next(err);
  }
};


/**
 * EXPORT CONTROLLERS
 */
module.exports = {
  getFollowUps,
  createFollowUp,
  completeFollowUp
};
