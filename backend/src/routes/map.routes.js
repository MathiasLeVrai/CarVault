const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/pois', mapController.getPois);

module.exports = router;
