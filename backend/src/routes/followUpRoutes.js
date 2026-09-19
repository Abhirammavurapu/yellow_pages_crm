const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', followUpController.getFollowUps);
router.post('/', followUpController.createFollowUp);
router.patch('/:id/complete', followUpController.completeFollowUp);

module.exports = router;
