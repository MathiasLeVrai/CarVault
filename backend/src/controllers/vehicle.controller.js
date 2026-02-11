const vehicleService = require('../services/vehicle.service');
const pdfService = require('../services/pdf.service');
const healthService = require('../services/health.service');

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
      const health = await healthService.getHealthScore(req.params.id, req.userId);
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

      const data = {
        brand,
        model,
        year: parseInt(year),
        mileage: parseInt(mileage) || 0,
        licensePlate: licensePlate || null,
        color: color || null,
        fuelType: fuelType || 'GASOLINE',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        photo: req.file ? `/uploads/vehicles/${req.file.filename}` : null,
        carapiTrimId: carapiTrimId ? parseInt(carapiTrimId) : null,
        msrp: msrp ? parseFloat(msrp) : null,
        horsepower: horsepower ? parseInt(horsepower) : null,
        engineSize: engineSize ? parseFloat(engineSize) : null,
        transmission: transmission || null,
        bodyType: bodyType || null,
        doors: doors ? parseInt(doors) : null,
      };

      const vehicle = await vehicleService.create(data, req.userId);
      res.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = { ...req.body };
      if (data.year) data.year = parseInt(data.year);
      if (data.mileage) data.mileage = parseInt(data.mileage);
      if (req.file) data.photo = `/uploads/vehicles/${req.file.filename}`;

      const vehicle = await vehicleService.update(req.params.id, data, req.userId);
      res.json(vehicle);
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
      const health = await healthService.getHealthScore(req.params.id, req.userId);

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
