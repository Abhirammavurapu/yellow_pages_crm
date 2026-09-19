const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/summary', dashboardController.getDashboardSummary);
router.get('/charts', dashboardController.getDashboardCharts);

module.exports = router;
