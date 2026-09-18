const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const { success, error } = require('../utils/apiResponse');
const { logAudit } = require('../services/auditService');
const { EMPLOYEE_STATUS } = require('../config/constants');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in .env');
}


/**
 * Login employee
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return error(
        res,
        'Email and password are required',
        'MISSING_CREDENTIALS',
        400
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find employee in MongoDB
    const employee = await Employee.findOne({
      email: normalizedEmail
    })
      .populate('teamId', 'name');

    // Employee not found
    if (!employee) {
      return error(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    // Check password
    const isMatch = await employee.comparePassword(password);

    if (!isMatch) {
      return error(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    // Check employee status
    if (
      employee.status === EMPLOYEE_STATUS.DEACTIVATED ||
      employee.status === EMPLOYEE_STATUS.RESIGNED
    ) {
      return error(
        res,
        'Your account is deactivated or resigned. Please contact Super Admin.',
        'ACCOUNT_DISABLED',
        403
      );
    }

    // Check deleted account
    if (employee.isDeleted) {
      return error(
        res,
        'Your account has been deleted.',
        'ACCOUNT_DELETED',
        403
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: employee._id.toString(),
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role,
        name: employee.name
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );

    // Create login audit log
    await logAudit({
      actor: employee,
      action: 'LOGIN',
      entity: 'AUTH',
      entityId: employee._id,
      ipAddress:
        req.ip ||
        req.headers['x-forwarded-for'] ||
        '',
      userAgent:
        req.headers['user-agent'] ||
        ''
    });

    // Remove sensitive information
    const userSafe = employee.toSafeObject();

    return success(
      res,
      {
        token,
        user: userSafe
      },
      'Login successful',
      200
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Get current logged-in employee
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // Authentication middleware must provide req.user
    if (!req.user || !req.user._id) {
      return error(
        res,
        'Authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Get latest employee data directly from MongoDB
    const employee = await Employee.findById(req.user._id)
      .select('-passwordHash')
      .populate(
        'teamId',
        'name department'
      )
      .populate(
        'managerId',
        'name employeeId role'
      );

    if (!employee) {
      return error(
        res,
        'Employee not found',
        'NOT_FOUND',
        404
      );
    }

    // Check deleted account
    if (employee.isDeleted) {
      return error(
        res,
        'Your account has been deleted.',
        'ACCOUNT_DELETED',
        403
      );
    }

    // Check disabled account
    if (
      employee.status === EMPLOYEE_STATUS.DEACTIVATED ||
      employee.status === EMPLOYEE_STATUS.RESIGNED
    ) {
      return error(
        res,
        'Your account is disabled.',
        'ACCOUNT_DISABLED',
        403
      );
    }

    return success(
      res,
      employee,
      'Current user fetched',
      200
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Logout employee
 * POST /api/auth/logout
 *
 * JWT is stateless, so logout is handled by
 * removing the token on the frontend.
 * We only create an audit record here.
 */
const logout = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      await logAudit({
        actor: req.user,
        action: 'LOGOUT',
        entity: 'AUTH',
        entityId: req.user._id,
        ipAddress:
          req.ip ||
          req.headers['x-forwarded-for'] ||
          '',
        userAgent:
          req.headers['user-agent'] ||
          ''
      });
    }

    return success(
      res,
      null,
      'Logged out successfully',
      200
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Change employee password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const {
      currentPassword,
      newPassword
    } = req.body;

    // Validate fields
    if (!currentPassword || !newPassword) {
      return error(
        res,
        'Current password and new password are required',
        'MISSING_FIELDS',
        400
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return error(
        res,
        'New password must be at least 6 characters',
        'PASSWORD_TOO_SHORT',
        400
      );
    }

    // Get employee from MongoDB
    const employee = await Employee.findById(
      req.user._id
    );

    if (!employee) {
      return error(
        res,
        'Employee not found',
        'NOT_FOUND',
        404
      );
    }

    // Check current password
    const isMatch =
      await employee.comparePassword(
        currentPassword
      );

    if (!isMatch) {
      return error(
        res,
        'Current password does not match',
        'INVALID_CURRENT_PASSWORD',
        400
      );
    }

    // Hash new password
    employee.passwordHash =
      await Employee.hashPassword(
        newPassword
      );

    // Save to MongoDB
    await employee.save();

    // Audit password change
    await logAudit({
      actor: employee,
      action: 'CHANGE_PASSWORD',
      entity: 'EMPLOYEE',
      entityId: employee._id,
      ipAddress:
        req.ip ||
        req.headers['x-forwarded-for'] ||
        '',
      userAgent:
        req.headers['user-agent'] ||
        ''
    });

    return success(
      res,
      null,
      'Password changed successfully',
      200
    );

  } catch (err) {
    next(err);
  }
};


/**
 * Check whether the initial CRM setup is required.
 * GET /api/auth/setup-status
 *
 * Public endpoint. Signup is only enabled when there are no employees.
 */
const getSetupStatus = async (req, res, next) => {
  try {
    const employeeCount = await Employee.countDocuments({ isDeleted: false });

    return success(
      res,
      {
        setupRequired: employeeCount === 0,
        employeeCount
      },
      'Setup status fetched',
      200
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Create the first Super Admin account.
 * POST /api/auth/signup
 *
 * This endpoint is intentionally limited to the initial setup.
 */
const signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword
    } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword) {
      return error(
        res,
        'Name, email, phone, password and confirm password are required',
        'MISSING_FIELDS',
        400
      );
    }

    if (password !== confirmPassword) {
      return error(
        res,
        'Passwords do not match',
        'PASSWORD_MISMATCH',
        400
      );
    }

    if (password.length < 8) {
      return error(
        res,
        'Password must be at least 8 characters',
        'PASSWORD_TOO_SHORT',
        400
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      return error(res, 'Name must be at least 2 characters', 'INVALID_NAME', 400);
    }

    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return error(res, 'Phone must contain 10 to 15 digits', 'INVALID_PHONE', 400);
    }

    // Only the first account can be created publicly.
    const employeeCount = await Employee.countDocuments({ isDeleted: false });
    if (employeeCount > 0) {
      return error(
        res,
        'Initial signup is already completed. Please sign in.',
        'SETUP_ALREADY_COMPLETED',
        403
      );
    }

    const existingEmail = await Employee.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return error(res, 'An account with this email already exists', 'EMAIL_EXISTS', 409);
    }

    const passwordHash = await Employee.hashPassword(password);

    const employee = await Employee.create({
      employeeId: 'ADMIN001',
      name: cleanName,
      email: normalizedEmail,
      phone: cleanPhone,
      passwordHash,
      role: 'SUPER_ADMIN',
      department: 'Administration',
      status: EMPLOYEE_STATUS.ACTIVE,
      isDeleted: false
    });

    await logAudit({
      actor: employee,
      action: 'INITIAL_SIGNUP',
      entity: 'EMPLOYEE',
      entityId: employee._id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    });

    return success(
      res,
      employee.toSafeObject(),
      'Super Admin account created successfully. Please sign in.',
      201
    );
  } catch (err) {
    if (err?.code === 11000) {
      return error(
        res,
        'An account with this email or employee ID already exists',
        'DUPLICATE_ACCOUNT',
        409
      );
    }
    next(err);
  }
};


module.exports = {
  login,
  getSetupStatus,
  signup,
  getMe,
  logout,
  changePassword
};