const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const Team = require('../models/Team');

const { success, error } = require('../utils/apiResponse');

const {
  normalizePhoneNumber,
  normalizePhoneNumbers
} = require('../utils/phoneNormalizer');

const { checkDuplicate } = require('../services/duplicateService');
const {
  acquireLock,
  releaseLock,
  renewLock
} = require('../services/lockService');

const { logActivity } = require('../services/activityService');
const { logAudit } = require('../services/auditService');
const { ROLES } = require('../config/constants');


/* =========================================================
   HELPER: GENERATE LEAD ID
   ========================================================= */

async function generateLeadId() {
  const count = await Lead.countDocuments();

  const randomSuffix = Math.floor(
    1000 + Math.random() * 9000
  );

  return `YP-${10000 + count + 1}-${randomSuffix}`;
}


/* =========================================================
   GET ALL LEADS
   ========================================================= */

const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      state,
      district,
      city,
      pincode,
      category,
      status,
      priority,
      source,
      assignedTo,
      assignedTeam,
      unassigned,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 25, 1),
      100
    );

    const query = {
      isDeleted: false
    };


    /* =====================================================
       ROLE BASED ACCESS
       ===================================================== */

    if (
      [
        ROLES.EMPLOYEE,
        ROLES.TELECALLER,
        ROLES.BDE
      ].includes(req.user.role)
    ) {
      query.assignedTo = req.user._id;
    }

    else if (req.user.role === ROLES.TEAM_LEAD) {

      const myTeams = await Team.find({
        teamLeadId: req.user._id
      });

      const teamIds = myTeams.map(
        team => team._id
      );

      const teamMembers = myTeams.flatMap(
        team => team.members || []
      );

      query.$or = [
        {
          assignedTeam: {
            $in: teamIds
          }
        },
        {
          assignedTo: {
            $in: [
              ...teamMembers,
              req.user._id
            ]
          }
        }
      ];
    }

    else if (
      req.user.role === ROLES.ADMIN ||
      req.user.role === ROLES.SUPER_ADMIN
    ) {

      if (assignedTo) {
        query.assignedTo = assignedTo;
      }

      if (assignedTeam) {
        query.assignedTeam = assignedTeam;
      }
    }


    /* =====================================================
       UNASSIGNED
       ===================================================== */

    if (unassigned === 'true') {
      query.assignedTo = null;
    }


    /* =====================================================
       LOCATION FILTERS
       ===================================================== */

    if (
      state &&
      state !== 'All India'
    ) {
      query.state = new RegExp(
        `^${state.trim()}$`,
        'i'
      );
    }

    if (district) {
      query.district = new RegExp(
        `^${district.trim()}$`,
        'i'
      );
    }

    if (city) {
      query.city = new RegExp(
        `^${city.trim()}$`,
        'i'
      );
    }

    if (pincode) {
      query.pincode = pincode.trim();
    }


    /* =====================================================
       OTHER FILTERS
       ===================================================== */

    if (category) {
      query.category = category;
    }

    if (status) {
      query.currentStatus = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (source) {
      query.source = source;
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    if (search && search.trim()) {

      const searchTrimmed =
        search.trim();

      const normPhone =
        normalizePhoneNumber(
          searchTrimmed
        );

      const escapedSearch =
        searchTrimmed.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );

      const searchRegex =
        new RegExp(
          escapedSearch,
          'i'
        );

      const searchConditions = [
        {
          businessName: searchRegex
        },
        {
          ownerName: searchRegex
        },
        {
          email: searchRegex
        },
        {
          leadId: searchRegex
        },
        {
          city: searchRegex
        },
        {
          state: searchRegex
        },
        {
          district: searchRegex
        }
      ];

      if (normPhone) {
        searchConditions.push({
          phoneNumbers: normPhone
        });
      }


      /* Preserve Team Lead access */
      if (query.$or) {

        query.$and = [
          {
            $or: query.$or
          },
          {
            $or: searchConditions
          }
        ];

        delete query.$or;
      }

      else {

        query.$or =
          searchConditions;
      }
    }


    /* =====================================================
       SORT / PAGINATION
       ===================================================== */

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'businessName',
      'state',
      'city',
      'priority',
      'currentStatus'
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : 'createdAt';

    const sort = {
      [safeSortBy]:
        sortOrder === 'asc'
          ? 1
          : -1
    };


    /* =====================================================
       MONGODB QUERY
       ===================================================== */

    const [leads, total] =
      await Promise.all([

        Lead.find(query)
          .populate(
            'assignedTo',
            'name employeeId role'
          )
          .populate(
            'assignedTeam',
            'name'
          )
          .populate(
            'assignedBy',
            'name employeeId'
          )
          .populate(
            'lock.lockedBy',
            'name employeeId'
          )
          .sort(sort)
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        Lead.countDocuments(query)
      ]);


    return success(
      res,
      leads,
      'Leads retrieved',
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


/* =========================================================
   GET SINGLE LEAD
   ========================================================= */

const getLeadById = async (
  req,
  res,
  next
) => {

  try {

    const { id } =
      req.params;

    const lead =
      await Lead.findById(id)
        .populate(
          'assignedTo',
          'name employeeId role email phone'
        )
        .populate(
          'assignedTeam',
          'name'
        )
        .populate(
          'assignedBy',
          'name employeeId'
        )
        .populate(
          'previousOwners',
          'name employeeId role'
        )
        .populate(
          'assignmentHistory.fromEmployee',
          'name employeeId'
        )
        .populate(
          'assignmentHistory.toEmployee',
          'name employeeId'
        )
        .populate(
          'assignmentHistory.assignedBy',
          'name employeeId'
        )
        .populate(
          'lock.lockedBy',
          'name employeeId role'
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


    /* Employee access check */

    if (
      [
        ROLES.EMPLOYEE,
        ROLES.TELECALLER,
        ROLES.BDE
      ].includes(req.user.role)
    ) {

      if (
        String(lead.assignedTo?._id) !==
        String(req.user._id)
      ) {
        return error(
          res,
          'Access denied to this lead',
          'FORBIDDEN',
          403
        );
      }
    }


    return success(
      res,
      lead,
      'Lead details retrieved'
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   CREATE NEW LEAD
   ========================================================= */

const createLead = async (
  req,
  res,
  next
) => {

  try {

    const {
      businessName,
      ownerName,
      phone,
      alternatePhone,
      email,
      website,
      category,
      subCategory,
      address,
      city,
      district,
      state,
      pincode,
      source,
      sourceDetails,
      priority,
      assignedTo,
      assignedTeam,
      notes
    } = req.body;


    /* Required fields */

    if (
      !businessName ||
      !phone
    ) {
      return error(
        res,
        'Business name and phone number are required',
        'MISSING_FIELDS',
        400
      );
    }


    /* Normalize phone */

    const normPhone =
      normalizePhoneNumber(
        phone
      );

    if (!normPhone) {
      return error(
        res,
        'Invalid phone number format',
        'INVALID_PHONE',
        400
      );
    }


    /* Duplicate check */

    const dupCheck =
      await checkDuplicate(
        normPhone,
        email
      );

    if (
      dupCheck.isDuplicate
    ) {

      return error(
        res,
        `Duplicate detected: A lead with this ${dupCheck.duplicateField} already exists (${dupCheck.existingLead.leadId} - ${dupCheck.existingLead.businessName})`,
        'DUPLICATE_LEAD',
        409,
        {
          existingLead:
            dupCheck.existingLead
        }
      );
    }


    /* Generate Lead ID */

    const leadId =
      await generateLeadId();


    /* Prepare MongoDB document */

    const newLeadData = {

      leadId,

      businessName:
        businessName.trim(),

      ownerName:
        ownerName
          ? ownerName.trim()
          : '',

      phoneNumbers: [
        normPhone
      ],

      alternatePhoneNumbers:
        alternatePhone
          ? normalizePhoneNumbers(
              alternatePhone
            )
          : [],

      email:
        email
          ? email.toLowerCase().trim()
          : '',

      website:
        website
          ? website.trim()
          : '',

      category:
        category || 'General',

      subCategory:
        subCategory || '',

      address:
        address || '',

      city:
        city
          ? city.trim()
          : '',

      district:
        district
          ? district.trim()
          : '',

      state:
        state
          ? state.trim()
          : '',

      pincode:
        pincode
          ? pincode.trim()
          : '',

      source:
        source || 'YELLOW_PAGES',

      sourceDetails:
        sourceDetails || '',

      priority:
        priority || 'MEDIUM',

      currentStatus:
        'NEW',

      notes: notes
        ? [
            {
              text: notes,
              author: req.user._id,
              authorName: req.user.name,
              createdAt: new Date()
            }
          ]
        : []
    };


    /* Initial employee assignment */

    if (assignedTo) {

      const employee =
        await Employee.findById(
          assignedTo
        );

      if (
        !employee ||
        employee.isDeleted
      ) {
        return error(
          res,
          'Assigned employee not found',
          'EMPLOYEE_NOT_FOUND',
          404
        );
      }

      newLeadData.assignedTo =
        assignedTo;

      newLeadData.assignedBy =
        req.user._id;

      newLeadData.assignmentDate =
        new Date();

      newLeadData.assignmentHistory =
        [
          {
            fromEmployee: null,
            toEmployee: assignedTo,
            assignedBy: req.user._id,
            assignedAt: new Date(),
            reason:
              'Initial assignment'
          }
        ];
    }


    /* Team assignment */

    if (assignedTeam) {

      const team =
        await Team.findById(
          assignedTeam
        );

      if (!team) {
        return error(
          res,
          'Assigned team not found',
          'TEAM_NOT_FOUND',
          404
        );
      }

      newLeadData.assignedTeam =
        assignedTeam;
    }


    /* =====================================================
       SAVE DIRECTLY TO MONGODB
       ===================================================== */

    const lead =
      await Lead.create(
        newLeadData
      );


    /* Activity */

    await logActivity({
      actor: req.user,
      action: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: lead._id,
      leadId: lead._id,
      newValue: {
        leadId: lead.leadId,
        businessName:
          lead.businessName,
        phone:
          normPhone
      }
    });


    return success(
      res,
      lead,
      'Lead created successfully',
      201
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   UPDATE LEAD
   ========================================================= */

const updateLead = async (
  req,
  res,
  next
) => {

  try {

    const { id } =
      req.params;

    const updateData =
      {
        ...req.body
      };


    const lead =
      await Lead.findById(id);

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


    /* Role access */

    if (
      [
        ROLES.EMPLOYEE,
        ROLES.TELECALLER,
        ROLES.BDE
      ].includes(req.user.role)
    ) {

      if (
        String(lead.assignedTo) !==
        String(req.user._id)
      ) {
        return error(
          res,
          'You are not assigned to this lead',
          'FORBIDDEN',
          403
        );
      }
    }


    /* Phone update */

    if (updateData.phone) {

      const normPhone =
        normalizePhoneNumber(
          updateData.phone
        );

      if (!normPhone) {
        return error(
          res,
          'Invalid phone number',
          'INVALID_PHONE',
          400
        );
      }


      const dupCheck =
        await checkDuplicate(
          normPhone,
          updateData.email,
          lead._id
        );

      if (
        dupCheck.isDuplicate
      ) {
        return error(
          res,
          `Duplicate detected for ${dupCheck.duplicateField}`,
          'DUPLICATE_LEAD',
          409
        );
      }


      updateData.phoneNumbers =
        [normPhone];

      delete updateData.phone;
    }


    /* Alternate phone */

    if (
      updateData.alternatePhone
    ) {

      updateData.alternatePhoneNumbers =
        normalizePhoneNumbers(
          updateData.alternatePhone
        );

      delete updateData.alternatePhone;
    }


    /* Email */

    if (updateData.email) {

      updateData.email =
        updateData.email
          .toLowerCase()
          .trim();
    }


    const oldSnapshot = {

      businessName:
        lead.businessName,

      currentStatus:
        lead.currentStatus,

      priority:
        lead.priority
    };


    /* =====================================================
       SAVE CHANGES TO MONGODB
       ===================================================== */

    Object.assign(
      lead,
      updateData
    );

    await lead.save();


    await logActivity({

      actor: req.user,

      action:
        'LEAD_UPDATED',

      entityType:
        'LEAD',

      entityId:
        lead._id,

      leadId:
        lead._id,

      previousValue:
        oldSnapshot,

      newValue: {

        businessName:
          lead.businessName,

        currentStatus:
          lead.currentStatus,

        priority:
          lead.priority
      }
    });


    return success(
      res,
      lead,
      'Lead updated successfully'
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   UPDATE STATUS / PRIORITY
   ========================================================= */

const updateLeadStatus = async (
  req,
  res,
  next
) => {

  try {

    const { id } =
      req.params;

    const {
      status,
      priority,
      note
    } = req.body;


    const lead =
      await Lead.findById(id);

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


    /* Role access */

    if (
      [
        ROLES.EMPLOYEE,
        ROLES.TELECALLER,
        ROLES.BDE
      ].includes(req.user.role)
    ) {

      if (
        String(lead.assignedTo) !==
        String(req.user._id)
      ) {
        return error(
          res,
          'You are not assigned to this lead',
          'FORBIDDEN',
          403
        );
      }
    }


    const oldStatus =
      lead.currentStatus;


    if (status) {
      lead.currentStatus =
        status;
    }

    if (priority) {
      lead.priority =
        priority;
    }


    if (note) {

      if (!Array.isArray(lead.notes)) {
        lead.notes = [];
      }

      lead.notes.push({

        text: note,

        author:
          req.user._id,

        authorName:
          req.user.name,

        createdAt:
          new Date()
      });
    }


    /* Save to MongoDB */

    await lead.save();


    await logActivity({

      actor: req.user,

      action:
        'LEAD_STATUS_CHANGED',

      entityType:
        'LEAD',

      entityId:
        lead._id,

      leadId:
        lead._id,

      previousValue: {
        status:
          oldStatus
      },

      newValue: {
        status:
          lead.currentStatus,

        note:
          note || ''
      }
    });


    return success(
      res,
      lead,
      `Status updated to ${lead.currentStatus}`
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   ASSIGN / REASSIGN LEAD
   ========================================================= */

const assignLead = async (
  req,
  res,
  next
) => {

  try {

    const { id } =
      req.params;

    const {
      assignedTo,
      assignedTeam,
      reason =
        'Manual Reassignment'
    } = req.body;


    if (
      !assignedTo &&
      !assignedTeam
    ) {
      return error(
        res,
        'Assigned employee or team is required',
        'MISSING_FIELDS',
        400
      );
    }


    const lead =
      await Lead.findById(id);

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


    let targetEmployee =
      null;


    if (assignedTo) {

      targetEmployee =
        await Employee.findById(
          assignedTo
        );

      if (
        !targetEmployee ||
        targetEmployee.isDeleted
      ) {
        return error(
          res,
          'Assigned employee not found',
          'NOT_FOUND',
          404
        );
      }
    }


    if (assignedTeam) {

      const team =
        await Team.findById(
          assignedTeam
        );

      if (!team) {
        return error(
          res,
          'Assigned team not found',
          'TEAM_NOT_FOUND',
          404
        );
      }
    }


    const previousOwnerId =
      lead.assignedTo;

    const now =
      new Date();


    const assignmentRecord = {

      fromEmployee:
        previousOwnerId || null,

      toEmployee:
        assignedTo || null,

      assignedBy:
        req.user._id,

      assignedAt:
        now,

      reason
    };


    lead.assignedTo =
      assignedTo || null;


    if (assignedTeam) {

      lead.assignedTeam =
        assignedTeam;

    } else if (
      targetEmployee &&
      targetEmployee.teamId
    ) {

      lead.assignedTeam =
        targetEmployee.teamId;
    }


    lead.assignedBy =
      req.user._id;

    lead.assignmentDate =
      now;


    /* Release current lock */

    lead.lock = {

      isLocked: false,

      lockedBy: null,

      lockedAt: null,

      lockExpiresAt: null
    };


    if (
      !Array.isArray(
        lead.assignmentHistory
      )
    ) {
      lead.assignmentHistory =
        [];
    }


    lead.assignmentHistory.push(
      assignmentRecord
    );


    if (previousOwnerId) {

      if (
        lead.previousOwners &&
        typeof lead.previousOwners.addToSet ===
          'function'
      ) {

        lead.previousOwners.addToSet(
          previousOwnerId
        );

      } else {

        if (
          !Array.isArray(
            lead.previousOwners
          )
        ) {
          lead.previousOwners =
            [];
        }

        if (
          !lead.previousOwners.some(
            id =>
              String(id) ===
              String(previousOwnerId)
          )
        ) {
          lead.previousOwners.push(
            previousOwnerId
          );
        }
      }
    }


    /* Save to MongoDB */

    await lead.save();


    await logActivity({

      actor: req.user,

      action:
        previousOwnerId
          ? 'LEAD_REASSIGNED'
          : 'LEAD_ASSIGNED',

      entityType:
        'LEAD',

      entityId:
        lead._id,

      leadId:
        lead._id,

      previousValue: {
        assignedTo:
          previousOwnerId
      },

      newValue: {
        assignedTo:
          assignedTo || null,

        assignedTeam:
          lead.assignedTeam ||
          null,

        reason
      }
    });


    return success(
      res,
      lead,
      'Lead assigned successfully'
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   BULK ASSIGN LEADS
   ========================================================= */

const bulkAssignLeads = async (
  req,
  res,
  next
) => {

  try {

    const {
      leadIds,
      assignedTo,
      assignedTeam,
      reason =
        'Bulk Assignment'
    } = req.body;


    if (
      !Array.isArray(leadIds) ||
      leadIds.length === 0
    ) {
      return error(
        res,
        'List of lead IDs is required',
        'MISSING_FIELDS',
        400
      );
    }


    if (
      !assignedTo &&
      !assignedTeam
    ) {
      return error(
        res,
        'Target employee or team is required',
        'MISSING_FIELDS',
        400
      );
    }


    let targetEmployee =
      null;


    if (assignedTo) {

      targetEmployee =
        await Employee.findById(
          assignedTo
        );

      if (
        !targetEmployee ||
        targetEmployee.isDeleted
      ) {
        return error(
          res,
          'Target employee not found',
          'EMPLOYEE_NOT_FOUND',
          404
        );
      }
    }


    let teamId =
      assignedTeam ||
      targetEmployee?.teamId ||
      null;


    if (assignedTeam) {

      const team =
        await Team.findById(
          assignedTeam
        );

      if (!team) {
        return error(
          res,
          'Target team not found',
          'TEAM_NOT_FOUND',
          404
        );
      }
    }


    const now =
      new Date();


    /* Get actual leads so previous owners are preserved */

    const leads =
      await Lead.find({
        _id: {
          $in: leadIds
        },
        isDeleted: false
      });


    const updateOps =
      leads.map(lead => {

        const assignmentRecord = {

          fromEmployee:
            lead.assignedTo ||
            null,

          toEmployee:
            assignedTo ||
            null,

          assignedBy:
            req.user._id,

          assignedAt:
            now,

          reason
        };


        return {

          updateOne: {

            filter: {
              _id: lead._id,
              isDeleted: false
            },

            update: {

              $set: {

                assignedTo:
                  assignedTo ||
                  null,

                assignedTeam:
                  teamId,

                assignedBy:
                  req.user._id,

                assignmentDate:
                  now,

                'lock.isLocked':
                  false,

                'lock.lockedBy':
                  null,

                'lock.lockedAt':
                  null,

                'lock.lockExpiresAt':
                  null
              },

              $push: {

                assignmentHistory:
                  assignmentRecord,

                ...(lead.assignedTo
                  ? {
                      previousOwners:
                        lead.assignedTo
                    }
                  : {})
              }
            }
          }
        };
      });


    if (updateOps.length === 0) {

      return success(
        res,
        {
          modifiedCount: 0
        },
        'No valid leads found'
      );
    }


    /* Bulk update in MongoDB */

    const result =
      await Lead.bulkWrite(
        updateOps,
        {
          ordered: false
        }
      );


    await logAudit({

      actor:
        req.user,

      action:
        'BULK_ASSIGN_LEADS',

      entity:
        'LEAD',

      entityId:
        null,

      newValue: {

        leadCount:
          leadIds.length,

        modifiedCount:
          result.modifiedCount,

        assignedTo:
          assignedTo ||
          null,

        teamId,

        reason
      }
    });


    return success(
      res,
      {
        modifiedCount:
          result.modifiedCount
      },
      `Successfully assigned ${result.modifiedCount} leads`
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   ACQUIRE LEAD LOCK
   ========================================================= */

const lockLeadEndpoint = async (
  req,
  res,
  next
) => {

  try {

    const { id } =
      req.params;


    const result =
      await acquireLock(
        id,
        req.user._id
      );


    if (!result.success) {

      return res
        .status(423)
        .json({

          success: false,

          message:
            result.message,

          errorCode:
            'LEAD_LOCKED',

          lockedBy:
            result.lockedBy,

          lockExpiresAt:
            result.lockExpiresAt
        });
    }


    return success(
      res,
      {
        lead:
          result.lead,

        lockExpiresAt:
          result.lockExpiresAt
      },
      'Lead locked successfully'
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   RELEASE LEAD LOCK
   ========================================================= */

const unlockLeadEndpoint = async (
  req,
  res,
  next
) => {

  try {

    const { id } =
      req.params;


    const isAdmin =
      [
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
      ].includes(
        req.user.role
      );


    const released =
      await releaseLock(
        id,
        req.user._id,
        isAdmin
      );


    return success(
      res,
      {
        released
      },
      'Lead lock released'
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   RENEW LEAD LOCK
   ========================================================= */

const heartbeatLeadEndpoint =
  async (
    req,
    res,
    next
  ) => {

    try {

      const { id } =
        req.params;


      const result =
        await renewLock(
          id,
          req.user._id
        );


      if (!result.success) {

        return error(
          res,
          'Failed to renew lock. Lock may have expired or been taken by another user.',
          'LOCK_RENEWAL_FAILED',
          409
        );
      }


      return success(
        res,
        {
          lockExpiresAt:
            result.lockExpiresAt
        },
        'Lock renewed'
      );

    } catch (err) {
      next(err);
    }
  };


/* =========================================================
   PUBLIC WEBSITE LEAD CAPTURE
   ========================================================= */

const publicLeadCapture = async (
  req,
  res,
  next
) => {

  try {

    const {
      businessName,
      phone,
      ownerName,
      email,
      category,
      city,
      state,
      address,
      message
    } = req.body;


    if (
      !businessName ||
      !phone
    ) {
      return error(
        res,
        'Business name and phone are required',
        'MISSING_FIELDS',
        400
      );
    }


    const normPhone =
      normalizePhoneNumber(
        phone
      );


    if (!normPhone) {
      return error(
        res,
        'Invalid phone number format',
        'INVALID_PHONE',
        400
      );
    }


    const dup =
      await checkDuplicate(
        normPhone,
        email
      );


    if (dup.isDuplicate) {

      return success(
        res,
        {
          isDuplicate:
            true,

          leadId:
            dup.existingLead.leadId
        },
        'Inquiry received'
      );
    }


    const leadId =
      await generateLeadId();


    /* Save website lead to MongoDB */

    const lead =
      await Lead.create({

        leadId,

        businessName:
          businessName.trim(),

        ownerName:
          ownerName
            ? ownerName.trim()
            : '',

        phoneNumbers:
          [normPhone],

        email:
          email
            ? email.toLowerCase().trim()
            : '',

        category:
          category ||
          'General',

        city:
          city || '',

        state:
          state || '',

        address:
          address || '',

        source:
          'WEBSITE',

        sourceDetails:
          message ||
          'Submitted via website contact form',

        currentStatus:
          'NEW',

        priority:
          'HIGH'
      });


    await logActivity({

      actor: null,

      actorName:
        'Website Visitor',

      actorRole:
        'PUBLIC',

      action:
        'LEAD_CREATED',

      entityType:
        'LEAD',

      entityId:
        lead._id,

      leadId:
        lead._id,

      newValue: {

        leadId:
          lead.leadId,

        businessName:
          lead.businessName,

        source:
          'WEBSITE'
      }
    });


    return success(
      res,
      {
        leadId:
          lead.leadId
      },
      'Inquiry submitted successfully',
      201
    );

  } catch (err) {
    next(err);
  }
};


/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {

  getLeads,

  getLeadById,

  createLead,

  updateLead,

  updateLeadStatus,

  assignLead,

  bulkAssignLeads,

  lockLeadEndpoint,

  unlockLeadEndpoint,

  heartbeatLeadEndpoint,

  publicLeadCapture
};