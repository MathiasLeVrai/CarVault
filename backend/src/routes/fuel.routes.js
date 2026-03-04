const express = require('express');
const router = express.Router({ mergeParams: true });
const fuelController = require('../controllers/fuel.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', fuelController.getAll);
router.post('/', fuelController.create);
router.delete('/:id', fuelController.delete);

module.exports = router;
