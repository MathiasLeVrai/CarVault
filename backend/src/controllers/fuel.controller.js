const fuelService = require('../services/fuel.service');

class FuelController {
  async getAll(req, res, next) {
    try {
      const result = await fuelService.getAll(req.params.vehicleId, req.userId);
      res.json(result);
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const entry = await fuelService.create(req.params.vehicleId, req.userId, req.body);
      res.status(201).json(entry);
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await fuelService.delete(req.params.id, req.userId);
      res.json({ message: 'Entrée supprimée' });
    } catch (error) { next(error); }
  }
}

module.exports = new FuelController();
