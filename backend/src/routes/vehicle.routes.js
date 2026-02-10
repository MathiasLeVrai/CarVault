const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadVehiclePhoto } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);
router.get('/:id/pdf', vehicleController.generatePdf);
router.post('/', uploadVehiclePhoto.single('photo'), vehicleController.create);
router.put('/:id', uploadVehiclePhoto.single('photo'), vehicleController.update);
router.delete('/:id', vehicleController.delete);

module.exports = router;
