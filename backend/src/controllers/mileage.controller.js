const mileageService = require('../services/mileage.service');

class MileageController {
  async getAll(req, res, next) {
    try {
      const entries = await mileageService.getAll(req.params.vehicleId, req.userId);
      res.json(entries);
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const { mileage, date, notes } = req.body;
      if (!mileage || !date) return res.status(400).json({ error: 'mileage et date requis' });
      const entry = await mileageService.create(req.params.vehicleId, req.userId, { mileage, date, notes });
      res.status(201).json(entry);
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await mileageService.delete(req.params.id, req.userId);
      res.json({ message: 'Entrée supprimée' });
    } catch (error) { next(error); }
  }
}

module.exports = new MileageController();
