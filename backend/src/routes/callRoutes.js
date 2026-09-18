const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/lead/:leadId', callController.getLeadCalls);
router.post('/lead/:leadId', callController.logCall);
router.get('/', callController.getAllCalls);

module.exports = router;
