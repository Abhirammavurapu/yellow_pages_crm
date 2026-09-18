const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateToken);

router.get('/hierarchy', employeeController.getHierarchy);
router.get('/teams', employeeController.getTeams);
router.post(
  '/teams',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  employeeController.createTeam
);

router.get(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.TEAM_LEAD),
  employeeController.getEmployees
);

router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HR_ADMIN),
  employeeController.createEmployee
);

router.get(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.TEAM_LEAD),
  employeeController.getEmployeeById
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.ADMIN),
  employeeController.updateEmployee
);

// Rule 2: Only SUPER_ADMIN can deactivate/resign an employee
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.SUPER_ADMIN),
  employeeController.updateEmployeeStatus
);

module.exports = router;
