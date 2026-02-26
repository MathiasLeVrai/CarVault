const express = require('express');
const router = express.Router({ mergeParams: true });
const mileageController = require('../controllers/mileage.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', mileageController.getAll);
router.post('/', mileageController.create);
router.delete('/:id', mileageController.delete);

module.exports = router;
