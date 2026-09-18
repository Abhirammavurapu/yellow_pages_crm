const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateToken);
router.use(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.TEAM_LEAD));

router.get('/', reportController.getReports);

module.exports = router;
