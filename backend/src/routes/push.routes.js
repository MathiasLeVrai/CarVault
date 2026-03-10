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

// Test push notification
router.post('/test', async (req, res, next) => {
  try {
    if (!pushService.isConfigured()) {
      return res.status(503).json({ error: 'Push non configuré (VAPID keys manquantes)' });
    }
    const sent = await pushService.sendToUser(
      req.userId,
      'CarVault — Test',
      'Les notifications push fonctionnent correctement !',
      '/settings',
    );
    if (sent === 0) {
      return res.status(404).json({ error: 'Aucun appareil enregistré. Activez les notifications push d\'abord.' });
    }
    res.json({ ok: true, sent });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
