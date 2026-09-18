const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Configure multer memory storage with 50MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

router.use(authenticateToken);
router.use(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.post('/preview', upload.single('file'), importController.previewImport);
router.post('/validate', upload.single('file'), importController.validateImport);
router.post('/execute', upload.single('file'), importController.executeImport);

module.exports = router;
