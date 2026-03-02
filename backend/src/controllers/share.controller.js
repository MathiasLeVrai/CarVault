const shareService = require('../services/share.service');
const healthService = require('../services/health.service');
const pdfService = require('../services/pdf.service');

class ShareController {
  async createLink(req, res, next) {
    try {
      const { vehicleId } = req.body;
      if (!vehicleId) return res.status(400).json({ error: 'vehicleId requis' });
      const link = await shareService.createLink(vehicleId, req.userId, req.body.expiresInDays || 30);
      res.status(201).json(link);
    } catch (error) { next(error); }
  }

  async getPublicVehicle(req, res, next) {
    try {
      const { token } = req.params;
      const link = await shareService.getByToken(token);
      const vehicle = link.vehicle;

      let health = null;
      try { health = await healthService.getHealthScore(vehicle.id, link.userId); } catch {}

      const currentYear = new Date().getFullYear();
      const totalExpenses = vehicle.expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const yearExpenses = vehicle.expenses
        .filter(e => new Date(e.date).getFullYear() === currentYear)
        .reduce((s, e) => s + (e.amount || 0), 0);

      res.json({
        vehicle: {
          brand: vehicle.brand, model: vehicle.model, year: vehicle.year,
          mileage: vehicle.mileage, photo: vehicle.photo, color: vehicle.color,
          fuelType: vehicle.fuelType, licensePlate: vehicle.licensePlate,
          horsepower: vehicle.horsepower, engineSize: vehicle.engineSize,
          transmission: vehicle.transmission, bodyType: vehicle.bodyType, doors: vehicle.doors,
        },
        documents: vehicle.documents.map(d => ({
          name: d.name, type: d.type, expirationDate: d.expirationDate, createdAt: d.createdAt,
        })),
        expenses: vehicle.expenses.map(e => ({
          category: e.category, date: e.date, description: e.description, amount: e.amount, mileage: e.mileage,
        })),
        stats: { totalExpenses, yearExpenses },
        health,
        expiresAt: link.expiresAt,
      });
    } catch (error) { next(error); }
  }

  async getPublicPdf(req, res, next) {
    try {
      const { token } = req.params;
      const link = await shareService.getByToken(token);
      const vehicle = link.vehicle;

      let health = null;
      try { health = await healthService.getHealthScore(vehicle.id, link.userId); } catch {}

      const totalExpenses = vehicle.expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const pdfBuffer = await pdfService.generateVehicleDossier(
        vehicle, vehicle.documents, vehicle.expenses, { totalExpensesAll: totalExpenses }, health,
      );

      const filename = `CarVault_${vehicle.brand}_${vehicle.model}.pdf`.replace(/\s+/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) { next(error); }
  }

  async revokeLink(req, res, next) {
    try {
      await shareService.revokeLink(req.params.id, req.userId);
      res.json({ message: 'Lien révoqué' });
    } catch (error) { next(error); }
  }

  async getLinks(req, res, next) {
    try {
      const links = await shareService.getLinksForVehicle(req.params.vehicleId, req.userId);
      res.json(links);
    } catch (error) { next(error); }
  }
}

module.exports = new ShareController();
