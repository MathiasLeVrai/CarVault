const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', expenseController.getAll);
router.get('/stats', expenseController.getStats);
router.get('/vehicle/:vehicleId', expenseController.getByVehicle);
router.post('/', expenseController.create);
router.delete('/:id', expenseController.delete);

module.exports = router;
