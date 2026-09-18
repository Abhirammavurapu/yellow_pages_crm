const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Public lead submission webhook from external websites
router.post('/public', leadController.publicLeadCapture);

// Protected routes
router.use(authenticateToken);

router.get('/', leadController.getLeads);
router.post('/', leadController.createLead);
router.get('/:id', leadController.getLeadById);
router.put('/:id', leadController.updateLead);
router.patch('/:id/status', leadController.updateLeadStatus);

// Concurrency locking endpoints
router.post('/:id/lock', leadController.lockLeadEndpoint);
router.post('/:id/unlock', leadController.unlockLeadEndpoint);
router.post('/:id/heartbeat', leadController.heartbeatLeadEndpoint);

// Assignment endpoints (Rule 1: Only authorized users can assign leads)
router.post(
  '/:id/assign',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD),
  leadController.assignLead
);

router.post(
  '/bulk-assign',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD),
  leadController.bulkAssignLeads
);

module.exports = router;
