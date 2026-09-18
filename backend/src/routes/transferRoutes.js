const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateToken);

router.get(
  '/preview/:employeeId',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  transferController.getTransferPreview
);

router.post(
  '/execute',
  authorizeRoles(ROLES.SUPER_ADMIN),
  transferController.executeTransfer
);

router.get(
  '/history',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  transferController.getTransferHistory
);

module.exports = router;
