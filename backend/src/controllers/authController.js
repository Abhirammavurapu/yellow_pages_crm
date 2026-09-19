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
 * Generate JWT token
 */
const generateToken = (employee) => {
  return jwt.sign(
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
};

/**
 * Signup
 */
const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role: requestedRole,
      adminKey
    } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return error(
        res,
        'Name, email and password are required',
        'VALIDATION_ERROR',
        400
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
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
        'Password must be at least 8 characters long',
        'WEAK_PASSWORD',
        400
      );
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false
    });

    if (existingEmployee) {
      return error(
        res,
        'An account with this email already exists',
        'EMAIL_ALREADY_EXISTS',
        409
      );
    }

    /*
     * First account:
     * SUPER_ADMIN
     *
     * Later public signup:
     * TELECALLER by default
     *
     * Admin creation:
     * Requires ADMIN_REGISTRATION_KEY
     */
    const employeeCount = await Employee.countDocuments({
      isDeleted: false
    });

    let assignedRole = 'TELECALLER';
    let assignedDept = 'Inside Sales';
    let newEmployeeId = `EMP${String(employeeCount + 1).padStart(3, '0')}`;

    if (employeeCount === 0) {
      assignedRole = 'SUPER_ADMIN';
      assignedDept = 'Executive Administration';
      newEmployeeId = 'ADMIN001';
    } else if (requestedRole === 'ADMIN') {
      const validKey =
        process.env.ADMIN_REGISTRATION_KEY || 'ADMIN2024';

      if (!adminKey || adminKey.trim() !== validKey) {
        return error(
          res,
          'Invalid admin registration key',
          'INVALID_ADMIN_KEY',
          403
        );
      }

      assignedRole = 'ADMIN';
      assignedDept = 'Operations & Administration';
      newEmployeeId = `ADM${String(employeeCount + 1).padStart(3, '0')}`;
    } else if (
      ['TELECALLER', 'BDE', 'EMPLOYEE'].includes(requestedRole)
    ) {
      assignedRole = requestedRole;
      assignedDept =
        requestedRole === 'BDE'
          ? 'Field Sales'
          : 'Inside Sales';
    }

    // Hash password
    const passwordHash = await Employee.hashPassword(password);

    // Create employee
    const employee = await Employee.create({
      employeeId: newEmployeeId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      passwordHash,
      role: assignedRole,
      department: assignedDept,
      status: EMPLOYEE_STATUS.ACTIVE,
      isDeleted: false
    });

    // Audit log
    try {
      await logAudit({
        employeeId: employee._id,
        action:
          employeeCount === 0
            ? 'INITIAL_SIGNUP'
            : 'USER_SIGNUP',
        details: {
          email: employee.email,
          role: employee.role,
          employeeId: employee.employeeId
        }
      });
    } catch (auditError) {
      console.error(
        '[Audit] Signup audit failed:',
        auditError.message
      );
    }

    // Generate token
    const token = generateToken(employee);

    return success(
      res,
      {
        token,
        user: employee.toSafeObject()
      },
      `${
        assignedRole === 'ADMIN'
          ? 'Admin'
          : assignedRole === 'SUPER_ADMIN'
            ? 'Super Admin'
            : 'User'
      } account created successfully. Welcome to Yellow Pages CRM!`,
      201
    );
  } catch (err) {
    console.error('[Auth] Signup error:', err);

    if (err.code === 11000) {
      return error(
        res,
        'An account with this email or employee ID already exists',
        'DUPLICATE_ACCOUNT',
        409
      );
    }

    return error(
      res,
      'Failed to create account',
      'SIGNUP_ERROR',
      500,
      err.message
    );
  }
};

/**
 * Login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(
        res,
        'Email and password are required',
        'VALIDATION_ERROR',
        400
      );
    }

    const employee = await Employee.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false
    }).select('+passwordHash');

    if (!employee) {
      return error(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    if (
      employee.status &&
      employee.status !== EMPLOYEE_STATUS.ACTIVE
    ) {
      return error(
        res,
        'Your account is not active. Please contact the administrator.',
        'ACCOUNT_INACTIVE',
        403
      );
    }

    const isPasswordValid = await employee.comparePassword(password);

    if (!isPasswordValid) {
      return error(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    const token = generateToken(employee);

    try {
      await logAudit({
        employeeId: employee._id,
        action: 'LOGIN',
        details: {
          email: employee.email,
          role: employee.role
        }
      });
    } catch (auditError) {
      console.error(
        '[Audit] Login audit failed:',
        auditError.message
      );
    }

    return success(
      res,
      {
        token,
        user: employee.toSafeObject()
      },
      'Login successful'
    );
  } catch (err) {
    console.error('[Auth] Login error:', err);

    return error(
      res,
      'Failed to login',
      'LOGIN_ERROR',
      500,
      err.message
    );
  }
};

/**
 * Get current logged-in user
 */
const getMe = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.user.id,
      isDeleted: false
    });

    if (!employee) {
      return error(
        res,
        'User account not found',
        'USER_NOT_FOUND',
        404
      );
    }

    if (
      employee.status &&
      employee.status !== EMPLOYEE_STATUS.ACTIVE
    ) {
      return error(
        res,
        'Your account is not active',
        'ACCOUNT_INACTIVE',
        403
      );
    }

    return success(
      res,
      employee.toSafeObject(),
      'User details fetched successfully'
    );
  } catch (err) {
    console.error('[Auth] Get me error:', err);

    return error(
      res,
      'Failed to fetch user details',
      'GET_ME_ERROR',
      500,
      err.message
    );
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  try {
    if (req.user?.id) {
      try {
        await logAudit({
          employeeId: req.user.id,
          action: 'LOGOUT',
          details: {
            email: req.user.email,
            role: req.user.role
          }
        });
      } catch (auditError) {
        console.error(
          '[Audit] Logout audit failed:',
          auditError.message
        );
      }
    }

    return success(
      res,
      null,
      'Logout successful'
    );
  } catch (err) {
    console.error('[Auth] Logout error:', err);

    return error(
      res,
      'Failed to logout',
      'LOGOUT_ERROR',
      500,
      err.message
    );
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword
    } = req.body;

    if (!currentPassword || !newPassword) {
      return error(
        res,
        'Current password and new password are required',
        'VALIDATION_ERROR',
        400
      );
    }

    if (
      confirmPassword !== undefined &&
      newPassword !== confirmPassword
    ) {
      return error(
        res,
        'New passwords do not match',
        'PASSWORD_MISMATCH',
        400
      );
    }

    if (newPassword.length < 8) {
      return error(
        res,
        'New password must be at least 8 characters long',
        'WEAK_PASSWORD',
        400
      );
    }

    const employee = await Employee.findOne({
      _id: req.user.id,
      isDeleted: false
    }).select('+passwordHash');

    if (!employee) {
      return error(
        res,
        'User account not found',
        'USER_NOT_FOUND',
        404
      );
    }

    const isCurrentPasswordValid =
      await employee.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return error(
        res,
        'Current password is incorrect',
        'INVALID_CURRENT_PASSWORD',
        401
      );
    }

    employee.passwordHash =
      await Employee.hashPassword(newPassword);

    await employee.save();

    try {
      await logAudit({
        employeeId: employee._id,
        action: 'PASSWORD_CHANGE',
        details: {
          email: employee.email
        }
      });
    } catch (auditError) {
      console.error(
        '[Audit] Password change audit failed:',
        auditError.message
      );
    }

    return success(
      res,
      null,
      'Password changed successfully'
    );
  } catch (err) {
    console.error(
      '[Auth] Change password error:',
      err
    );

    return error(
      res,
      'Failed to change password',
      'CHANGE_PASSWORD_ERROR',
      500,
      err.message
    );
  }
};

/**
 * Check whether initial setup is required
 */
const getSetupStatus = async (req, res) => {
  try {
    const employeeCount = await Employee.countDocuments({
      isDeleted: false
    });

    return success(
      res,
      {
        setupRequired: employeeCount === 0,
        employeeCount
      },
      'Setup status fetched successfully'
    );
  } catch (err) {
    console.error(
      '[Auth] Setup status error:',
      err
    );

    return error(
      res,
      'Failed to fetch setup status',
      'SETUP_STATUS_ERROR',
      500,
      err.message
    );
  }
};

module.exports = {
  signup,
  login,
  getMe,
  logout,
  changePassword,
  getSetupStatus
};