const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Public listing search for yellow pages visitors
router.get('/public', listingController.getListings);

// Protected routes
router.use(authenticateToken);
router.get('/', listingController.getListings);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BDE), listingController.updateListing);

module.exports = router;
