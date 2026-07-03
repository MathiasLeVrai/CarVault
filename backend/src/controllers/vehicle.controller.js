const vehicleService = require('../services/vehicle.service');
const pdfService = require('../services/pdf.service');
const healthService = require('../services/health.service');
const storageService = require('../services/storage.service');
const prisma = require('../lib/prisma');
const { getMaintenanceIntervals, getApplicableMaintenanceItems } = require('../data/vehicles');
const { computeCritAir } = require('../services/critair.service');
const {
  buildMaintenancePlan,
  parseLastKmPayload,
  MAINTENANCE_LABELS,
} = require('../utils/maintenance.util');

class VehicleController {
  async getAll(req, res, next) {
    try {
      const vehicles = await vehicleService.getAll(req.userId);
      res.json(vehicles);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const vehicle = await vehicleService.getById(req.params.id, req.userId);
      let health = null;
      try { health = await healthService.getHealthScore(req.params.id, req.userId); } catch { /* health optionnel */ }
      res.json({ ...vehicle, health });
    } catch (error) {
      next(error);
    }
  }

  async getHealthScore(req, res, next) {
    try {
      const health = await healthService.getHealthScore(req.params.id, req.userId);
      if (!health) {
        return res.status(404).json({ error: 'Véhicule non trouvé' });
      }
      res.json(health);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { brand, model, year, mileage, licensePlate, color, fuelType, purchasePrice, annualKmGoal,
              carapiTrimId, msrp, horsepower, engineSize, transmission, bodyType, doors,
              fiscalPower, co2, firstRegistrationDate } = req.body;

      if (!brand || !model || !year) {
        return res.status(400).json({ error: 'Marque, modèle et année sont requis' });
      }

      // Carte grise optionnelle
      const regFile = req.files?.registrationDoc?.[0];

      // Vérifier que la plaque n'est pas déjà prise par un autre utilisateur
      if (licensePlate) {
        const existing = await prisma.vehicle.findFirst({
          where: { licensePlate: licensePlate.toUpperCase().replace(/\s+/g, '-'), userId: { not: req.userId } },
        });
        if (existing) {
          return res.status(409).json({ error: 'Ce véhicule est déjà enregistré par un autre utilisateur', code: 'PLATE_TAKEN' });
        }
      }

      const photoFile = req.files?.photo?.[0];
      const photo = photoFile
        ? await storageService.upload(photoFile.buffer, photoFile.originalname, 'vehicles')
        : null;

      const parsedMileage = parseInt(mileage) || 0;
      const data = {
        brand,
        model,
        year: parseInt(year),
        mileage: parsedMileage,
        purchaseMileage: parsedMileage,
        licensePlate: licensePlate || null,
        color: color || null,
        fuelType: fuelType || 'GASOLINE',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        annualKmGoal: annualKmGoal ? parseInt(annualKmGoal) : null,
        photo,
        carapiTrimId: carapiTrimId ? parseInt(carapiTrimId) : null,
        msrp: msrp ? parseFloat(msrp) : null,
        horsepower: horsepower ? parseInt(horsepower) : null,
        engineSize: engineSize ? parseFloat(engineSize) : null,
        transmission: transmission || null,
        bodyType: bodyType || null,
        doors: doors ? parseInt(doors) : null,
        fiscalPower: fiscalPower ? parseInt(fiscalPower) : null,
        co2: co2 ? parseInt(co2) : null,
        firstRegistrationDate: firstRegistrationDate ? new Date(firstRegistrationDate) : null,
        critAir: computeCritAir(fuelType || 'GASOLINE', firstRegistrationDate || null),
      };

      const vehicle = await vehicleService.create(data, req.userId);

      // Baselines d'entretien par type (km du dernier entretien connu)
      let maintenanceLastKm = {};
      if (req.body.maintenanceLastKm) {
        try {
          const parsed = typeof req.body.maintenanceLastKm === 'string'
            ? JSON.parse(req.body.maintenanceLastKm)
            : req.body.maintenanceLastKm;
          maintenanceLastKm = parseLastKmPayload(parsed);
        } catch { /* ignore invalid JSON */ }
      }

      // Si l'utilisateur indique que tout l'entretien est à jour, baseline = km actuel pour chaque type
      if (req.body.maintenanceUpToDate === 'true') {
        const intervals = getMaintenanceIntervals(brand, fuelType || 'GASOLINE');
        for (const [key, intervalKm] of Object.entries(intervals)) {
          if (intervalKm != null) maintenanceLastKm[key] = parsedMileage;
        }
      }

      if (Object.keys(maintenanceLastKm).length > 0) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { maintenanceLastKm },
        });
      }

      // Sauvegarder automatiquement la carte grise comme document REGISTRATION (si fournie)
      if (regFile) {
        const regPath = await storageService.upload(regFile.buffer, regFile.originalname, 'documents');
        await prisma.document.create({
          data: {
            name: 'Carte grise',
            type: 'REGISTRATION',
            filePath: regPath,
            fileName: regFile.originalname,
            vehicleId: vehicle.id,
          },
        });
      }

      res.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const intFields = ['year', 'mileage', 'horsepower', 'doors', 'annualKmGoal'];
      const floatFields = ['purchasePrice', 'msrp', 'engineSize', 'monthlyFuelBudget'];
      const stringFields = ['brand', 'model', 'licensePlate', 'color', 'fuelType', 'transmission', 'bodyType'];
      const allowed = [...intFields, ...floatFields, ...stringFields];
      const data = {};

      for (const key of allowed) {
        if (req.body[key] === undefined) continue;
        const val = req.body[key];
        if (intFields.includes(key)) { const n = parseInt(val); if (!isNaN(n)) data[key] = n; }
        else if (floatFields.includes(key)) { const n = parseFloat(val); data[key] = isNaN(n) ? null : n; }
        else { data[key] = val === '' ? null : val; }
      }

      if (req.file) {
        data.photo = await storageService.upload(req.file.buffer, req.file.originalname, 'vehicles');
      }

      const vehicle = await vehicleService.update(req.params.id, data, req.userId);
      res.json(vehicle);
    } catch (error) {
      next(error);
    }
  }

  async getMaintenanceTypes(req, res) {
    const fuelType = req.query.fuelType || 'GASOLINE';
    const brand = req.query.brand || '';
    res.json(getApplicableMaintenanceItems(brand, fuelType));
  }

  async getMaintenancePlan(req, res, next) {
    try {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: {
          expenses: { orderBy: { date: 'desc' } },
        },
      });
      if (!vehicle) return res.status(404).json({ error: 'Véhicule non trouvé' });

      res.json(buildMaintenancePlan(vehicle));
    } catch (error) {
      next(error);
    }
  }

  async updateMaintenancePlan(req, res, next) {
    try {
      const { intervals, lastKm } = req.body;
      if ((!intervals || typeof intervals !== 'object') && (!lastKm || typeof lastKm !== 'object')) {
        return res.status(400).json({ error: 'Intervalles ou kilométrages requis' });
      }

      const vehicle = await prisma.vehicle.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!vehicle) return res.status(404).json({ error: 'Véhicule non trouvé' });

      const data = {};
      if (intervals && typeof intervals === 'object') {
        const applicable = getMaintenanceIntervals(vehicle.brand, vehicle.fuelType || 'GASOLINE');
        const clean = {};
        for (const [k, v] of Object.entries(intervals)) {
          if (applicable[k] == null && v !== null) continue;
          if (!MAINTENANCE_LABELS[k]) continue;
          clean[k] = v === null ? null : parseInt(v);
        }
        data.maintenanceConfig = clean;
      }

      if (lastKm && typeof lastKm === 'object') {
        const parsed = parseLastKmPayload(lastKm);
        data.maintenanceLastKm = { ...(vehicle.maintenanceLastKm || {}), ...parsed };
      }

      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data,
      });

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async markMaintenanceDone(req, res, next) {
    try {
      const { key } = req.params;
      if (!MAINTENANCE_LABELS[key]) {
        return res.status(400).json({ error: 'Type d\'entretien invalide' });
      }

      const vehicle = await prisma.vehicle.findFirst({
        where: { id: req.params.id, userId: req.userId },
      });
      if (!vehicle) return res.status(404).json({ error: 'Véhicule non trouvé' });

      const lastKm = req.body?.lastKm != null
        ? parseInt(req.body.lastKm, 10)
        : vehicle.mileage;

      if (isNaN(lastKm) || lastKm < 0) {
        return res.status(400).json({ error: 'Kilométrage invalide' });
      }

      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          maintenanceLastKm: {
            ...(vehicle.maintenanceLastKm || {}),
            [key]: lastKm,
          },
        },
      });

      res.json({ ok: true, lastKm });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await vehicleService.delete(req.params.id, req.userId);
      res.json({ message: 'Véhicule supprimé avec succès' });
    } catch (error) {
      next(error);
    }
  }

  async generatePdf(req, res, next) {
    try {
      const { vehicle, documents, expenses, stats } = await vehicleService.getFullData(req.params.id, req.userId);
      let health = null;
      try { health = await healthService.getHealthScore(req.params.id, req.userId); } catch { /* health optionnel */ }

      const pdfBuffer = await pdfService.generateVehicleDossier(vehicle, documents, expenses, stats, health);

      const filename = `Carvio_${vehicle.brand}_${vehicle.model}_${new Date().getFullYear()}.pdf`
        .replace(/\s+/g, '_');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation failed:', error.message, error.stack);
      next(error);
    }
  }
}

module.exports = new VehicleController();
