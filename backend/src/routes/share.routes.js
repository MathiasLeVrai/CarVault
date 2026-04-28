const express = require('express');
const router = express.Router();
const shareController = require('../controllers/share.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Authenticated routes (specific paths first to avoid /:token matching)
router.post('/', authenticate, shareController.createLink);
router.get('/vehicle/:vehicleId', authenticate, shareController.getLinks);
router.delete('/link/:id', authenticate, shareController.revokeLink);

// Public routes (no auth) — must be after specific paths
router.get('/:token/check', shareController.checkAccess);
router.get('/:token', shareController.getPublicVehicle);
router.get('/:token/pdf', shareController.getPublicPdf);

module.exports = router;
