const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const bankController = require('../controllers/bank.controller');

router.get('/status', authenticate, bankController.getStatus);
router.get('/institutions', authenticate, bankController.listBanks);
router.post('/connect', authenticate, bankController.connect);
router.post('/callback', authenticate, bankController.callback);
router.delete('/disconnect', authenticate, bankController.disconnect);
router.get('/fuel-transactions', authenticate, bankController.detectFuel);

module.exports = router;
