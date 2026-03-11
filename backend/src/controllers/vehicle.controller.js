const vehicleService = require('../services/vehicle.service');
const pdfService = require('../services/pdf.service');
const healthService = require('../services/health.service');
const storageService = require('../services/storage.service');
const prisma = require('../lib/prisma');
const { getMaintenanceIntervals, MAINTENANCE_LABELS } = require('../data/vehicles');

function findLastExpenseForType(expenses, maintenanceKey) {
  const mapping = {
    oilChange: (e) => e.category === 'OIL_CHANGE' || (e.category === 'MAINTENANCE' && e.description && /vidange|huile|oil/i.test(e.description)),
    brakes: (e) => e.category === 'BRAKES' || (e.category === 'REPAIR' && e.description && /frein|brake|plaquette/i.test(e.description)),
    timingBelt: (e) => e.description && /courroie|distribution|timing|belt/i.test(e.description),
    tires: (e) => e.category === 'TIRES',
    generalService: (e) => e.category === 'MAINTENANCE',
    airFilter: (e) => e.description && /filtre.*air|air.*filter/i.test(e.description),
    cabinFilter: (e) => e.description && /filtre.*habitacle|cabin.*filter|filtre.*pollen/i.test(e.description),
    coolant: (e) => e.description && /liquide.*refroid|coolant|antigel/i.test(e.description),
    sparkPlugs: (e) => e.description && /bougie|spark.*plug/i.test(e.description),
  };
  const matcher = mapping[maintenanceKey];
  if (!matcher) return null;
  return expenses.find(matcher) || null;
}

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
      const { brand, model, year, mileage, licensePlate, color, fuelType, purchasePrice,
              carapiTrimId, msrp, horsepower, engineSize, transmission, bodyType, doors } = req.body;

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

      const data = {
        brand,
        model,
        year: parseInt(year),
        mileage: parseInt(mileage) || 0,
        licensePlate: licensePlate || null,
        color: color || null,
        fuelType: fuelType || 'GASOLINE',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        photo,
        carapiTrimId: carapiTrimId ? parseInt(carapiTrimId) : null,
        msrp: msrp ? parseFloat(msrp) : null,
        horsepower: horsepower ? parseInt(horsepower) : null,
        engineSize: engineSize ? parseFloat(engineSize) : null,
        transmission: transmission || null,
        bodyType: bodyType || null,
        doors: doors ? parseInt(doors) : null,
      };

      const vehicle = await vehicleService.create(data, req.userId);

      // Si l'utilisateur indique que l'entretien est à jour, créer des dépenses à 0€
      // pour que le cron ne génère pas d'alertes immédiatement
      if (req.body.maintenanceUpToDate === 'true') {
        const today = new Date();
        const mileageVal = parseInt(mileage) || 0;
        const maintenanceEntries = [
          { category: 'MAINTENANCE', description: 'Entretien à jour (déclaré à l\'ajout)' },
          { category: 'OIL_CHANGE', description: 'Vidange à jour (déclaré à l\'ajout)' },
        ];
        for (const entry of maintenanceEntries) {
          await prisma.expense.create({
            data: {
              amount: 0,
              category: entry.category,
              description: entry.description,
              date: today,
              mileage: mileageVal,
              vehicleId: vehicle.id,
            },
          });
        }
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
      const allowed = ['brand', 'model', 'year', 'mileage', 'licensePlate', 'color', 'fuelType', 'purchasePrice'];
      const data = {};

      for (const key of allowed) {
        if (req.body[key] === undefined) continue;
        const val = req.body[key];
        if (key === 'year') { const n = parseInt(val); if (!isNaN(n)) data.year = n; }
        else if (key === 'mileage') { const n = parseInt(val); if (!isNaN(n)) data.mileage = n; }
        else if (key === 'purchasePrice') { const n = parseFloat(val); data.purchasePrice = isNaN(n) ? null : n; }
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

  async getMaintenancePlan(req, res, next) {
    try {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: {
          expenses: { orderBy: { date: 'desc' } },
        },
      });
      if (!vehicle) return res.status(404).json({ error: 'Véhicule non trouvé' });

      // Intervalles par défaut basés sur marque/carburant
      const defaults = getMaintenanceIntervals(vehicle.brand, vehicle.fuelType || 'GASOLINE');
      // Merge avec les personnalisations de l'utilisateur
      const custom = vehicle.maintenanceConfig || {};
      const intervals = { ...defaults, ...custom };

      // Pour chaque type, calculer le dernier km et la prochaine échéance
      const plan = [];
      for (const [key, intervalKm] of Object.entries(intervals)) {
        if (intervalKm === null || intervalKm === undefined) continue;

        // Trouver la dernière dépense correspondante
        const lastExpense = findLastExpenseForType(vehicle.expenses, key);
        const lastKm = lastExpense?.mileage || 0;
        const lastDate = lastExpense?.date || null;
        const kmSinceLast = vehicle.mileage - lastKm;
        const nextAtKm = lastKm + intervalKm;
        const remaining = nextAtKm - vehicle.mileage;
        const pct = Math.min(100, Math.round((kmSinceLast / intervalKm) * 100));

        plan.push({
          key,
          label: MAINTENANCE_LABELS[key] || key,
          intervalKm,
          isCustom: custom[key] !== undefined,
          lastKm,
          lastDate,
          nextAtKm,
          remaining,
          pct,
          status: remaining <= 0 ? 'overdue' : pct >= 80 ? 'soon' : 'ok',
        });
      }

      // Trier : overdue d'abord, puis soon, puis ok
      const order = { overdue: 0, soon: 1, ok: 2 };
      plan.sort((a, b) => order[a.status] - order[b.status]);

      res.json({ plan, defaults, custom });
    } catch (error) {
      next(error);
    }
  }

  async updateMaintenancePlan(req, res, next) {
    try {
      const { intervals } = req.body;
      if (!intervals || typeof intervals !== 'object') {
        return res.status(400).json({ error: 'Intervalles requis' });
      }

      // Valider que les clés sont légitimes
      const validKeys = Object.keys(MAINTENANCE_LABELS);
      const clean = {};
      for (const [k, v] of Object.entries(intervals)) {
        if (!validKeys.includes(k)) continue;
        clean[k] = v === null ? null : parseInt(v);
      }

      const result = await prisma.vehicle.updateMany({
        where: { id: req.params.id, userId: req.userId },
        data: { maintenanceConfig: clean },
      });
      if (result.count === 0) return res.status(404).json({ error: 'Véhicule non trouvé' });

      res.json({ ok: true });
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

      const filename = `CarVault_${vehicle.brand}_${vehicle.model}_${new Date().getFullYear()}.pdf`
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
