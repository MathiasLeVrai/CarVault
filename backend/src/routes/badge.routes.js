const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const badgeController = require('../controllers/badge.controller');

router.get('/', authenticate, badgeController.getBadges);

module.exports = router;
