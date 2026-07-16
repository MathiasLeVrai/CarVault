const express = require('express');
const router = express.Router();
const shareController = require('../controllers/share.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { shareCreateBody, idParams, vehicleIdParams } = require('../validation/schemas');

// Authenticated routes (specific paths first to avoid /:token matching)
router.post('/', authenticate, validate({ body: shareCreateBody }), shareController.createLink);
router.get('/vehicle/:vehicleId', authenticate, validate({ params: vehicleIdParams }), shareController.getLinks);
router.delete('/link/:id', authenticate, validate({ params: idParams }), shareController.revokeLink);

// Public routes (no auth) — must be after specific paths
router.get('/:token/check', shareController.checkAccess);
router.get('/:token', shareController.getPublicVehicle);
router.get('/:token/pdf', shareController.getPublicPdf);

module.exports = router;
