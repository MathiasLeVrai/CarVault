const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadVehiclePhoto, uploadVehicleWithDoc } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);
router.get('/:id/pdf', vehicleController.generatePdf);
router.get('/:id/health', vehicleController.getHealthScore);
router.post('/', uploadVehicleWithDoc.fields([{ name: 'photo', maxCount: 1 }, { name: 'registrationDoc', maxCount: 1 }]), vehicleController.create);
router.put('/:id', uploadVehiclePhoto.single('photo'), vehicleController.update);
router.get('/:id/maintenance', vehicleController.getMaintenancePlan);
router.put('/:id/maintenance', vehicleController.updateMaintenancePlan);
router.delete('/:id', vehicleController.delete);

module.exports = router;
