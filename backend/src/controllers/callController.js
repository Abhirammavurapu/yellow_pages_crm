const CallHistory = require('../models/CallHistory');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');

const { success, error } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { releaseLock } = require('../services/lockService');


/**
 * GET /api/leads/:leadId/calls
 *
 * Get call history for a lead
 */
const getLeadCalls = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const calls = await CallHistory.find({ leadId })
      .populate(
        'employeeId',
        'name employeeId role'
      )
      .sort({ createdAt: -1 });

    return success(
      res,
      calls,
      'Call history retrieved',
      200
    );
  } catch (err) {
    next(err);
  }
};


/**
 * POST /api/leads/:leadId/calls
 *
 * Log a new call.
 *
 * Every call is stored as a new CallHistory document.
 * Historical call records are never modified.
 */
const logCall = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const {
      phoneNumber,
      callStatus,
      callStartTime,
      callEndTime,
      duration = 0,
      notes = '',
      followUpDate = null,
      followUpTime = '10:00 AM',
      followUpNotes = '',
      releaseLockAfterCall = true
    } = req.body;


    // --------------------------------------------------
    // 1. Check authentication
    // --------------------------------------------------

    if (!req.user || !req.user._id) {
      return error(
        res,
        'Authentication required',
        'UNAUTHORIZED',
        401
      );
    }


    // --------------------------------------------------
    // 2. Validate required fields
    // --------------------------------------------------

    if (!phoneNumber || !callStatus) {
      return error(
        res,
        'Phone number and call status are required',
        'MISSING_FIELDS',
        400
      );
    }


    // --------------------------------------------------
    // 3. Find lead from MongoDB
    // --------------------------------------------------

    const lead = await Lead.findById(leadId);

    if (!lead || lead.isDeleted) {
      return error(
        res,
        'Lead not found',
        'NOT_FOUND',
        404
      );
    }


    // --------------------------------------------------
    // 4. Prepare values
    // --------------------------------------------------

    const callDuration =
      parseInt(duration, 10) || 0;

    const startTime = callStartTime
      ? new Date(callStartTime)
      : new Date(
          Date.now() -
          callDuration * 1000
        );

    const endTime = callEndTime
      ? new Date(callEndTime)
      : new Date();


    if (isNaN(startTime.getTime())) {
      return error(
        res,
        'Invalid call start time',
        'INVALID_DATE',
        400
      );
    }

    if (isNaN(endTime.getTime())) {
      return error(
        res,
        'Invalid call end time',
        'INVALID_DATE',
        400
      );
    }


    // --------------------------------------------------
    // 5. Save call to MongoDB
    // --------------------------------------------------

    const callRecord = await CallHistory.create({
      leadId: lead._id,

      employeeId: req.user._id,

      // Historical snapshot
      employeeNameSnapshot:
        req.user.name || '',

      employeeRoleSnapshot:
        req.user.role || '',

      phoneNumber:
        phoneNumber.trim(),

      callStatus,

      callStartTime:
        startTime,

      callEndTime:
        endTime,

      duration:
        callDuration,

      notes:
        notes.trim(),

      followUpDate:
        followUpDate
          ? new Date(followUpDate)
          : null
    });


    // --------------------------------------------------
    // 6. Update lead
    // --------------------------------------------------

    const oldStatus =
      lead.currentStatus;

    lead.currentStatus =
      callStatus;

    lead.lastContactedAt =
      new Date();


    // --------------------------------------------------
    // 7. Create follow-up
    // --------------------------------------------------

    let followUpRecord = null;

    if (followUpDate) {

      const parsedFollowUpDate =
        new Date(followUpDate);

      if (
        isNaN(
          parsedFollowUpDate.getTime()
        )
      ) {
        return error(
          res,
          'Invalid follow-up date',
          'INVALID_DATE',
          400
        );
      }


      lead.nextFollowUpDate =
        parsedFollowUpDate;


      // Save follow-up to MongoDB
      followUpRecord =
        await FollowUp.create({

          leadId:
            lead._id,

          assignedTo:
            req.user._id,

          createdBy:
            req.user._id,

          createdByNameSnapshot:
            req.user.name || '',

          followUpDate:
            parsedFollowUpDate,

          followUpTime,

          notes:
            followUpNotes.trim() ||
            notes.trim(),

          status:
            'PENDING'
        });


      // Activity for follow-up
      await logActivity({
        actor: req.user,

        action:
          'FOLLOW_UP_SCHEDULED',

        entityType:
          'FOLLOW_UP',

        entityId:
          followUpRecord._id,

        leadId:
          lead._id,

        newValue: {
          followUpDate:
            parsedFollowUpDate,

          followUpTime
        }
      });
    }


    // --------------------------------------------------
    // 8. Add call notes to lead
    // --------------------------------------------------

    if (notes.trim()) {

      if (!Array.isArray(lead.notes)) {
        lead.notes = [];
      }

      lead.notes.push({
        text:
          `[Call: ${callStatus}] ${notes.trim()}`,

        author:
          req.user._id,

        authorName:
          req.user.name || '',

        createdAt:
          new Date()
      });
    }


    // --------------------------------------------------
    // 9. Release lead lock
    // --------------------------------------------------

    if (releaseLockAfterCall) {

      await releaseLock(
        lead._id,
        req.user._id
      );

      if (lead.lock) {

        lead.lock.isLocked =
          false;

        lead.lock.lockedBy =
          null;

        lead.lock.lockedAt =
          null;

        lead.lock.lockExpiresAt =
          null;
      }
    }


    // --------------------------------------------------
    // 10. Save updated lead to MongoDB
    // --------------------------------------------------

    await lead.save();


    // --------------------------------------------------
    // 11. Create activity record
    // --------------------------------------------------

    await logActivity({
      actor: req.user,

      action:
        'CALL_COMPLETED',

      entityType:
        'CALL',

      entityId:
        callRecord._id,

      leadId:
        lead._id,

      previousValue: {
        status:
          oldStatus
      },

      newValue: {
        status:
          callStatus,

        duration:
          callDuration,

        notes:
          notes.trim()
      },

      metadata: {
        callId:
          callRecord._id,

        phoneNumber:
          phoneNumber.trim()
      }
    });


    // --------------------------------------------------
    // 12. Return response
    // --------------------------------------------------

    return success(
      res,
      {
        call:
          callRecord,

        followUp:
          followUpRecord,

        lead
      },
      'Call logged successfully',
      201
    );

  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/calls
 *
 * Get all calls
 */
const getAllCalls = async (req, res, next) => {
  try {

    const {
      page = 1,
      limit = 25,
      employeeId,
      callStatus
    } = req.query;


    const pageNumber =
      parseInt(page, 10);

    const limitNumber =
      parseInt(limit, 10);


    const query = {};


    if (employeeId) {
      query.employeeId =
        employeeId;
    }


    if (callStatus) {
      query.callStatus =
        callStatus;
    }


    const skip =
      (pageNumber - 1) *
      limitNumber;


    const [
      calls,
      total
    ] = await Promise.all([

      CallHistory.find(query)

        .populate(
          'leadId',
          'businessName leadId city state phoneNumbers'
        )

        .populate(
          'employeeId',
          'name employeeId role'
        )

        .sort({
          createdAt: -1
        })

        .skip(skip)

        .limit(limitNumber),

      CallHistory.countDocuments(query)
    ]);


    return success(
      res,
      calls,
      'Calls retrieved',
      200,
      {
        page:
          pageNumber,

        limit:
          limitNumber,

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
  getLeadCalls,
  logCall,
  getAllCalls
};