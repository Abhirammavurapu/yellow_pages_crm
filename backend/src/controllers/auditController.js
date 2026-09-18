const AuditLog = require('../models/AuditLog');
const Activity = require('../models/Activity');
const { success } = require('../utils/apiResponse');

/**
 * Get audit logs
 * SUPER_ADMIN / ADMIN
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      entity,
      action
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const query = {};

    if (entity) {
      query.entity = entity;
    }

    if (action) {
      query.action = action;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name employeeId role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNumber),

      AuditLog.countDocuments(query)
    ]);

    return success(
      res,
      logs,
      'Audit logs retrieved',
      200,
      {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    );
  } catch (err) {
    next(err);
  }
};


/**
 * Get timeline activities for a lead
 */
const getLeadActivities = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const activities = await Activity.find({ leadId })
      .populate('actor', 'name employeeId role')
      .sort({ timestamp: -1 });

    return success(
      res,
      activities,
      'Lead activities retrieved',
      200
    );
  } catch (err) {
    next(err);
  }
};


/**
 * Create a new activity
 * Saves activity to MongoDB
 */
const createActivity = async (req, res, next) => {
  try {
    const {
      leadId,
      type,
      description
    } = req.body;

    // Validate required fields
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Activity type is required'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Activity description is required'
      });
    }

    // Make sure logged-in user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Create activity in MongoDB
    const activity = await Activity.create({
      leadId,
      actor: req.user._id,
      type,
      description,
      timestamp: new Date()
    });

    // Get populated activity
    const populatedActivity = await Activity.findById(
      activity._id
    ).populate(
      'actor',
      'name employeeId role'
    );

    return success(
      res,
      populatedActivity,
      'Activity created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};


/**
 * Delete an activity
 */
const deleteActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    await Activity.findByIdAndDelete(activityId);

    return success(
      res,
      null,
      'Activity deleted successfully',
      200
    );
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getAuditLogs,
  getLeadActivities,
  createActivity,
  deleteActivity
};