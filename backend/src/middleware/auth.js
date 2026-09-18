const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const { error } = require('../utils/apiResponse');
const { EMPLOYEE_STATUS } = require('../config/constants');

/**
 * Verify JWT token and attach active employee to req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication token required', 'AUTH_TOKEN_MISSING', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_yellow_pages_crm_production_2026!');

    const employee = await Employee.findById(decoded.id).select('-passwordHash');
    if (!employee) {
      return error(res, 'User no longer exists', 'USER_NOT_FOUND', 401);
    }

    // Check account status
    if (employee.status === EMPLOYEE_STATUS.DEACTIVATED || employee.status === EMPLOYEE_STATUS.RESIGNED) {
      return error(res, 'Account is deactivated or resigned. Access denied.', 'ACCOUNT_INACTIVE', 403);
    }

    if (employee.isDeleted) {
      return error(res, 'Account has been deleted', 'ACCOUNT_DELETED', 403);
    }

    req.user = employee;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Authentication token has expired', 'TOKEN_EXPIRED', 401);
    }
    return error(res, 'Invalid authentication token', 'INVALID_TOKEN', 401);
  }
};

/**
 * Role-Based Access Control middleware
 * Checks if req.user has one of the allowed roles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        'FORBIDDEN',
        403
      );
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
