const Employee = require('../models/Employee');
const Team = require('../models/Team');
const Lead = require('../models/Lead');
const CallHistory = require('../models/CallHistory');
const FollowUp = require('../models/FollowUp');

const { success, error } = require('../utils/apiResponse');
const { logAudit } = require('../services/auditService');
const {
  ROLES,
  EMPLOYEE_STATUS
} = require('../config/constants');


/**
 * GET ALL EMPLOYEES
 */
const getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      teamId,
      department,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const query = {
      isDeleted: false
    };

    // Team Lead can see only own team
    if (req.user.role === ROLES.TEAM_LEAD) {
      const myTeams = await Team.find({
        teamLeadId: req.user._id
      });

      const teamIds = myTeams.map(
        team => team._id
      );

      query.$or = [
        {
          teamId: {
            $in: teamIds
          }
        },
        {
          _id: req.user._id
        }
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;
    if (teamId) query.teamId = teamId;
    if (department) query.department = department;

    if (search) {
      const searchRegex =
        new RegExp(
          search.trim(),
          'i'
        );

      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { employeeId: searchRegex }
          ]
        }
      ];
    }

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const sort = {
      [sortBy]:
        sortOrder === 'asc'
          ? 1
          : -1
    };

    const [
      employees,
      total
    ] = await Promise.all([
      Employee.find(query)
        .select('-passwordHash')
        .populate(
          'teamId',
          'name'
        )
        .populate(
          'managerId',
          'name employeeId role'
        )
        .sort(sort)
        .skip(skip)
        .limit(limitNumber),

      Employee.countDocuments(query)
    ]);

    // Lead counts
    const employeeIds =
      employees.map(
        employee => employee._id
      );

    const leadCounts =
      await Lead.aggregate([
        {
          $match: {
            assignedTo: {
              $in: employeeIds
            },
            isDeleted: false
          }
        },
        {
          $group: {
            _id: '$assignedTo',
            count: {
              $sum: 1
            }
          }
        }
      ]);

    const leadCountMap =
      new Map();

    leadCounts.forEach(item => {
      leadCountMap.set(
        String(item._id),
        item.count
      );
    });

    const result =
      employees.map(employee => {
        const data =
          employee.toObject();

        data.assignedLeadsCount =
          leadCountMap.get(
            String(employee._id)
          ) || 0;

        return data;
      });

    return success(
      res,
      result,
      'Employees retrieved',
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


/**
 * CREATE EMPLOYEE
 * Saves employee directly to MongoDB
 */
const createEmployee = async (
  req,
  res,
  next
) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      password,
      role,
      department,
      teamId,
      managerId,
      joiningDate
    } = req.body;

    if (
      !employeeId ||
      !name ||
      !email ||
      !phone ||
      !password ||
      !role
    ) {
      return error(
        res,
        'Missing required employee fields',
        'MISSING_FIELDS',
        400
      );
    }

    const normalizedEmail =
      email
        .toLowerCase()
        .trim();

    const normalizedEmployeeId =
      employeeId
        .toUpperCase()
        .trim();

    // Check duplicate email
    const existingEmail =
      await Employee.findOne({
        email: normalizedEmail
      });

    if (existingEmail) {
      return error(
        res,
        `Email ${email} is already in use`,
        'EMAIL_EXISTS',
        409
      );
    }

    // Check duplicate employee ID
    const existingEmployeeId =
      await Employee.findOne({
        employeeId:
          normalizedEmployeeId
      });

    if (existingEmployeeId) {
      return error(
        res,
        `Employee ID ${employeeId} is already registered`,
        'EMPLOYEE_ID_EXISTS',
        409
      );
    }

    // Hash password
    const passwordHash =
      await Employee.hashPassword(
        password
      );

    // SAVE TO MONGODB
    const employee =
      await Employee.create({
        employeeId:
          normalizedEmployeeId,

        name:
          name.trim(),

        email:
          normalizedEmail,

        phone:
          phone.trim(),

        passwordHash,

        role,

        department:
          department || 'Sales',

        teamId:
          teamId || null,

        managerId:
          managerId || null,

        joiningDate:
          joiningDate
            ? new Date(joiningDate)
            : new Date(),

        createdBy:
          req.user._id
      });

    // Add employee to team
    if (teamId) {
      await Team.findByIdAndUpdate(
        teamId,
        {
          $addToSet: {
            members:
              employee._id
          }
        }
      );
    }

    // Audit
    await logAudit({
      actor: req.user,
      action: 'CREATE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: employee._id,
      newValue: {
        employeeId:
          employee.employeeId,
        name:
          employee.name,
        role:
          employee.role
      }
    });

    return success(
      res,
      employee.toSafeObject(),
      'Employee created successfully',
      201
    );

  } catch (err) {
    next(err);
  }
};


/**
 * GET EMPLOYEE BY ID
 */
const getEmployeeById = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const employee =
      await Employee.findById(id)
        .select('-passwordHash')
        .populate(
          'teamId',
          'name department'
        )
        .populate(
          'managerId',
          'name employeeId role'
        )
        .populate(
          'createdBy',
          'name employeeId'
        );

    if (
      !employee ||
      employee.isDeleted
    ) {
      return error(
        res,
        'Employee not found',
        'NOT_FOUND',
        404
      );
    }

    const [
      assignedLeadsCount,
      callsCount,
      pendingFollowUpsCount
    ] = await Promise.all([

      Lead.countDocuments({
        assignedTo:
          employee._id,
        isDeleted: false
      }),

      CallHistory.countDocuments({
        employeeId:
          employee._id
      }),

      FollowUp.countDocuments({
        assignedTo:
          employee._id,
        status: 'PENDING'
      })
    ]);

    const result =
      employee.toObject();

    result.stats = {
      assignedLeadsCount,
      callsCount,
      pendingFollowUpsCount
    };

    return success(
      res,
      result,
      'Employee details retrieved'
    );

  } catch (err) {
    next(err);
  }
};


/**
 * UPDATE EMPLOYEE
 */
const updateEmployee = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const {
      name,
      phone,
      department,
      teamId,
      managerId,
      role,
      joiningDate,
      password
    } = req.body;

    const employee =
      await Employee.findById(id);

    if (
      !employee ||
      employee.isDeleted
    ) {
      return error(
        res,
        'Employee not found',
        'NOT_FOUND',
        404
      );
    }

    const oldValue =
      employee.toSafeObject();

    if (name) {
      employee.name =
        name.trim();
    }

    if (phone) {
      employee.phone =
        phone.trim();
    }

    if (department) {
      employee.department =
        department;
    }

    if (joiningDate) {
      employee.joiningDate =
        new Date(joiningDate);
    }

    // Role change only by Super Admin
    if (
      role &&
      role !== employee.role
    ) {
      if (
        req.user.role !==
        ROLES.SUPER_ADMIN
      ) {
        return error(
          res,
          'Only Super Admin can change employee roles',
          'FORBIDDEN',
          403
        );
      }

      employee.role =
        role;
    }

    if (
      managerId !== undefined
    ) {
      employee.managerId =
        managerId || null;
    }

    // Team change
    if (
      teamId !== undefined &&
      String(teamId) !==
        String(employee.teamId)
    ) {

      if (employee.teamId) {
        await Team.findByIdAndUpdate(
          employee.teamId,
          {
            $pull: {
              members:
                employee._id
            }
          }
        );
      }

      employee.teamId =
        teamId || null;

      if (teamId) {
        await Team.findByIdAndUpdate(
          teamId,
          {
            $addToSet: {
              members:
                employee._id
            }
          }
        );
      }
    }

    // Change password
    if (
      password &&
      password.trim().length >= 6
    ) {
      employee.passwordHash =
        await Employee.hashPassword(
          password
        );
    }

    employee.updatedBy =
      req.user._id;

    // SAVE TO MONGODB
    await employee.save();

    await logAudit({
      actor: req.user,
      action: 'UPDATE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: employee._id,
      oldValue,
      newValue:
        employee.toSafeObject()
    });

    return success(
      res,
      employee.toSafeObject(),
      'Employee updated successfully'
    );

  } catch (err) {
    next(err);
  }
};


/**
 * UPDATE EMPLOYEE STATUS
 */
const updateEmployeeStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const { status } =
      req.body;

    if (
      !Object.values(
        EMPLOYEE_STATUS
      ).includes(status)
    ) {
      return error(
        res,
        'Invalid employee status value',
        'INVALID_STATUS',
        400
      );
    }

    if (
      (
        status ===
          EMPLOYEE_STATUS.DEACTIVATED ||
        status ===
          EMPLOYEE_STATUS.RESIGNED
      ) &&
      req.user.role !==
        ROLES.SUPER_ADMIN
    ) {
      return error(
        res,
        'Only Super Admin is authorized to deactivate or mark an employee as resigned',
        'SUPER_ADMIN_REQUIRED',
        403
      );
    }

    const employee =
      await Employee.findById(id);

    if (
      !employee ||
      employee.isDeleted
    ) {
      return error(
        res,
        'Employee not found',
        'NOT_FOUND',
        404
      );
    }

    const oldStatus =
      employee.status;

    employee.status =
      status;

    const now =
      new Date();

    if (
      status ===
      EMPLOYEE_STATUS.RESIGNED
    ) {
      employee.resignationDate =
        now;
    }

    if (
      status ===
      EMPLOYEE_STATUS.DEACTIVATED
    ) {
      employee.deactivatedDate =
        now;
    }

    if (
      status ===
      EMPLOYEE_STATUS.ACTIVE
    ) {
      employee.resignationDate =
        null;

      employee.deactivatedDate =
        null;
    }

    employee.updatedBy =
      req.user._id;

    await employee.save();

    await logAudit({
      actor: req.user,
      action:
        'UPDATE_EMPLOYEE_STATUS',
      entity: 'EMPLOYEE',
      entityId: employee._id,
      oldValue: {
        status:
          oldStatus
      },
      newValue: {
        status:
          employee.status
      }
    });

    return success(
      res,
      employee.toSafeObject(),
      `Employee status updated to ${status}`
    );

  } catch (err) {
    next(err);
  }
};


/**
 * GET ORGANIZATION HIERARCHY
 */
const getHierarchy = async (
  req,
  res,
  next
) => {
  try {

    const employees =
      await Employee.find({
        isDeleted: false,
        status:
          EMPLOYEE_STATUS.ACTIVE
      })
        .select(
          'employeeId name email role department teamId managerId'
        )
        .populate(
          'teamId',
          'name'
        )
        .lean();

    const superAdmins =
      employees.filter(
        e =>
          e.role ===
          ROLES.SUPER_ADMIN
      );

    const admins =
      employees.filter(
        e =>
          e.role ===
          ROLES.ADMIN
      );

    const hrAdmins =
      employees.filter(
        e =>
          e.role ===
          ROLES.HR_ADMIN
      );

    const teamLeads =
      employees.filter(
        e =>
          e.role ===
          ROLES.TEAM_LEAD
      );

    const callers =
      employees.filter(
        e =>
          [
            ROLES.EMPLOYEE,
            ROLES.TELECALLER,
            ROLES.BDE
          ].includes(e.role)
      );

    return success(
      res,
      {
        superAdmins,
        admins,
        hrAdmins,
        teamLeads,
        callers,
        totalActive:
          employees.length
      },
      'Hierarchy retrieved'
    );

  } catch (err) {
    next(err);
  }
};


/**
 * GET TEAMS
 */
const getTeams = async (
  req,
  res,
  next
) => {
  try {

    const teams =
      await Team.find({
        isActive: true
      })
        .populate(
          'teamLeadId',
          'name employeeId email phone'
        )
        .populate(
          'members',
          'name employeeId role status'
        );

    return success(
      res,
      teams,
      'Teams retrieved'
    );

  } catch (err) {
    next(err);
  }
};


/**
 * CREATE TEAM
 * Saves team to MongoDB
 */
const createTeam = async (
  req,
  res,
  next
) => {
  try {

    const {
      name,
      department,
      teamLeadId,
      members = []
    } = req.body;

    if (!name || !name.trim()) {
      return error(
        res,
        'Team name is required',
        'MISSING_FIELDS',
        400
      );
    }

    const team =
      await Team.create({
        name:
          name.trim(),

        department:
          department ||
          'Calling',

        teamLeadId:
          teamLeadId || null,

        members,

        createdBy:
          req.user._id
      });

    // Update employees
    if (members.length > 0) {
      await Employee.updateMany(
        {
          _id: {
            $in: members
          }
        },
        {
          $set: {
            teamId:
              team._id
          }
        }
      );
    }

    return success(
      res,
      team,
      'Team created successfully',
      201
    );

  } catch (err) {
    next(err);
  }
};


module.exports = {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  getHierarchy,
  getTeams,
  createTeam
};