const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const subscriptionController = require('../controllers/subscription.controller');

// Webhook must use raw body — register before express.json() parses it
// The raw body middleware is applied in index.js for this specific path

router.get('/status', authenticate, subscriptionController.getStatus);
router.post('/checkout', authenticate, subscriptionController.createCheckout);
router.post('/portal', authenticate, subscriptionController.createPortal);
router.post('/sync-apple', authenticate, subscriptionController.syncApple);
router.post('/webhook', subscriptionController.webhook);
router.post('/revenuecat-webhook', subscriptionController.revenueCatWebhook);

module.exports = router;
