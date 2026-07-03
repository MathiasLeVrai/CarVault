const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadVehiclePhoto, uploadVehicleWithDoc } = require('../middleware/upload.middleware');
const prisma = require('../lib/prisma');
const plateService = require('../services/plate.service');
const { computeCritAir } = require('../services/critair.service');

router.use(authenticate);

router.get('/', vehicleController.getAll);
router.get('/maintenance-types', vehicleController.getMaintenanceTypes);

// POST /api/vehicles/backfill — Met à jour Crit'Air, puissance fiscale, CO2 pour les véhicules existants
router.post('/backfill', async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId: req.user.id,
        licensePlate: { not: null },
        OR: [
          { critAir: null },
          { fiscalPower: null },
          { co2: null },
          { firstRegistrationDate: null },
        ],
      },
      select: { id: true, licensePlate: true, fuelType: true },
    });

    const results = [];
    for (const v of vehicles) {
      try {
        const plateData = await plateService.lookup(v.licensePlate);
        if (!plateData) {
          results.push({ id: v.id, plate: v.licensePlate, status: 'not_found' });
          continue;
        }

        const critAir = computeCritAir(plateData.fuelType || v.fuelType, plateData.firstRegistrationDate);

        await prisma.vehicle.update({
          where: { id: v.id },
          data: {
            fiscalPower: plateData.fiscalPower ?? undefined,
            co2: plateData.co2 ?? undefined,
            firstRegistrationDate: plateData.firstRegistrationDate ?? undefined,
            critAir: critAir ?? undefined,
          },
        });

        results.push({ id: v.id, plate: v.licensePlate, status: 'updated', critAir, fiscalPower: plateData.fiscalPower });
      } catch (err) {
        results.push({ id: v.id, plate: v.licensePlate, status: 'error', error: err.message });
      }
    }

    res.json({ updated: results.filter(r => r.status === 'updated').length, total: vehicles.length, results });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', vehicleController.getById);
router.get('/:id/pdf', vehicleController.generatePdf);
router.get('/:id/health', vehicleController.getHealthScore);
router.post('/', uploadVehicleWithDoc.fields([{ name: 'photo', maxCount: 1 }, { name: 'registrationDoc', maxCount: 1 }]), vehicleController.create);
router.put('/:id', uploadVehiclePhoto.single('photo'), vehicleController.update);
router.get('/:id/maintenance', vehicleController.getMaintenancePlan);
router.put('/:id/maintenance', vehicleController.updateMaintenancePlan);
router.post('/:id/maintenance/:key/mark-done', vehicleController.markMaintenanceDone);
router.delete('/:id', vehicleController.delete);

module.exports = router;
