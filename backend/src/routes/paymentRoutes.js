const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', paymentController.getPayments);
router.post('/', paymentController.createPayment);

module.exports = router;
