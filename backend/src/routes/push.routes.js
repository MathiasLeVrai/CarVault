const express = require('express');
const router = express.Router();
const pushService = require('../services/push.service');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
});

// Subscribe to push
router.post('/subscribe', async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ error: 'Subscription invalide' });
    }
    await pushService.subscribe(req.userId, subscription);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Unsubscribe
router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint requis' });
    await pushService.unsubscribe(req.userId, endpoint);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Register a native device token (Capacitor iOS via APNs)
router.post('/native-subscribe', async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requis' });
    if (platform !== 'IOS') {
      return res.status(400).json({ error: 'Plateforme invalide' });
    }
    await pushService.subscribeNative(req.userId, token);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Unregister a native device token
router.post('/native-unsubscribe', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requis' });
    await pushService.unsubscribeNative(req.userId, token);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
