const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, feedbackController.submit);

module.exports = router;
