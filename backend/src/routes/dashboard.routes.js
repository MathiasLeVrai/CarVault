const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const fuelPriceService = require('../services/fuel-price.service');

router.use(authenticate);

router.get('/', dashboardController.getData);

// Prix carburant nationaux (cache 1h cote serveur)
router.get('/fuel-prices', async (_req, res, next) => {
  try {
    const prices = await fuelPriceService.getPrices();
    res.json(prices);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
