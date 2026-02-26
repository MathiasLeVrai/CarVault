const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', alertController.getAll);
router.get('/count', alertController.countUnread);
router.post('/check', alertController.checkExpiring);
router.put('/read-all', alertController.markAllAsRead);
router.put('/:id/read', alertController.markAsRead);
router.put('/:id/snooze', alertController.snooze);
router.delete('/:id', alertController.delete);

module.exports = router;
