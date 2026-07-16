const shareService = require('../services/share.service');
const healthService = require('../services/health.service');
const pdfService = require('../services/pdf.service');
const storageService = require('../services/storage.service');

function readPassword(req) {
  // Header only — never accept ?p= (leaks via history, logs, Referer)
  return req.headers['x-share-password'] || null;
}

function sanitizeFilename(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function sanitizeVehicleForShare(vehicle, link) {
  const v = {
    brand: vehicle.brand, model: vehicle.model, year: vehicle.year,
    mileage: vehicle.mileage, photo: vehicle.photo, color: vehicle.color,
    fuelType: vehicle.fuelType, licensePlate: vehicle.licensePlate,
    horsepower: vehicle.horsepower, engineSize: vehicle.engineSize,
    transmission: vehicle.transmission, bodyType: vehicle.bodyType, doors: vehicle.doors,
    fiscalPower: vehicle.fiscalPower, critAir: vehicle.critAir, co2: vehicle.co2,
  };
  if (!link.hidePurchasePrice) {
    v.purchasePrice = vehicle.purchasePrice;
  }
  return v;
}

class ShareController {
  async createLink(req, res, next) {
    try {
      const { vehicleId, expiresInDays, password, hidePurchasePrice, label } = req.body;
      if (!vehicleId) return res.status(400).json({ error: 'vehicleId requis' });
      const link = await shareService.createLink(vehicleId, req.userId, {
        expiresInDays, password, hidePurchasePrice, label,
      });
      const { passwordHash, ...safe } = link;
      res.status(201).json({ ...safe, hasPassword: !!passwordHash });
    } catch (error) { next(error); }
  }

  async getPublicVehicle(req, res, next) {
    try {
      const { token } = req.params;
      const link = await shareService.getByToken(token);
      await shareService.verifyAccess(link, readPassword(req));

      const vehicle = link.vehicle;

      let health = null;
      try { health = await healthService.getHealthScore(vehicle.id, link.userId); } catch { /* ignore */ }

      const currentYear = new Date().getFullYear();
      const totalExpenses = vehicle.expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const yearExpenses = vehicle.expenses
        .filter(e => new Date(e.date).getFullYear() === currentYear)
        .reduce((s, e) => s + (e.amount || 0), 0);

      shareService.trackView(link.id).catch(() => {});

      const payload = {
        vehicle: sanitizeVehicleForShare(vehicle, link),
        documents: vehicle.documents.map(d => ({
          name: d.name, type: d.type, expirationDate: d.expirationDate, createdAt: d.createdAt,
        })),
        expenses: vehicle.expenses.map(e => ({
          category: e.category, date: e.date, description: e.description, amount: e.amount, mileage: e.mileage,
        })),
        stats: { totalExpenses, yearExpenses },
        health,
        expiresAt: link.expiresAt,
        sharedAt: link.createdAt,
      };
      res.json(await storageService.signAssets(payload));
    } catch (error) { next(error); }
  }

  async checkAccess(req, res, next) {
    try {
      const { token } = req.params;
      const link = await shareService.getByToken(token);
      res.json({
        requiresPassword: !!link.passwordHash,
        expiresAt: link.expiresAt,
      });
    } catch (error) { next(error); }
  }

  async getPublicPdf(req, res, next) {
    try {
      const { token } = req.params;
      const link = await shareService.getByToken(token);
      await shareService.verifyAccess(link, readPassword(req));

      const vehicle = link.vehicle;

      let health = null;
      try { health = await healthService.getHealthScore(vehicle.id, link.userId); } catch { /* ignore */ }

      const totalExpenses = vehicle.expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const sanitizedVehicle = {
        ...vehicle,
        ...sanitizeVehicleForShare(vehicle, link),
        ...(link.hidePurchasePrice ? { purchasePrice: null } : {}),
      };
      const pdfBuffer = await pdfService.generateVehicleDossier(
        sanitizedVehicle, vehicle.documents, vehicle.expenses,
        { totalExpensesAll: totalExpenses }, health,
        { sharedAt: link.createdAt },
      );

      shareService.trackView(link.id).catch(() => {});

      const filename = sanitizeFilename(`Carvio_${vehicle.brand}_${vehicle.model}`) + '.pdf';
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
