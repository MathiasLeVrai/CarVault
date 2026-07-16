const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadVehiclePhoto, uploadVehicleWithDoc } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');
const { vehicleCreateBody, vehicleUpdateBody, idParams } = require('../validation/schemas');
const prisma = require('../lib/prisma');
const plateService = require('../services/plate.service');
const { computeCritAir } = require('../services/critair.service');

router.use(authenticate);

router.get('/', vehicleController.getAll);
router.get('/maintenance-types', vehicleController.getMaintenanceTypes);

// POST /api/vehicles/backfill — Met à jour Crit'Air, puissance fiscale, CO2 pour les véhicules existants
router.post('/backfill', async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicule.findMany({
      where: {
        userId: req.userId,
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

        await prisma.vehicule.update({
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

router.get('/:id', validate({ params: idParams }), vehicleController.getById);
router.get('/:id/pdf', validate({ params: idParams }), vehicleController.generatePdf);
router.get('/:id/health', validate({ params: idParams }), vehicleController.getHealthScore);
router.post(
  '/',
  uploadVehicleWithDoc.fields([{ name: 'photo', maxCount: 1 }, { name: 'registrationDoc', maxCount: 1 }]),
  validate({ body: vehicleCreateBody }),
  vehicleController.create,
);
router.put(
  '/:id',
  validate({ params: idParams }),
  uploadVehiclePhoto.single('photo'),
  validate({ body: vehicleUpdateBody }),
  vehicleController.update,
);
router.get('/:id/maintenance', validate({ params: idParams }), vehicleController.getMaintenancePlan);
router.put('/:id/maintenance', validate({ params: idParams }), vehicleController.updateMaintenancePlan);
router.post('/:id/maintenance/:key/mark-done', validate({ params: idParams }), vehicleController.markMaintenanceDone);
router.delete('/:id', validate({ params: idParams }), vehicleController.delete);

module.exports = router;
