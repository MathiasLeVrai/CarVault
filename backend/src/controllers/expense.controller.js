const expenseService = require('../services/expense.service');

class ExpenseController {
  async getByVehicle(req, res, next) {
    try {
      const filters = { category: req.query.category };
      const expenses = await expenseService.getByVehicle(req.params.vehicleId, req.userId, filters);
      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        year: req.query.year,
      };
      const expenses = await expenseService.getAllByUser(req.userId, filters);
      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await expenseService.getStats(req.userId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { amount, category, date, description, mileage, vehicleId } = req.body;

      if (amount == null || amount === '' || !category || !date || !vehicleId) {
        return res.status(400).json({ error: 'Montant, catégorie, date et véhicule sont requis' });
      }

      if (parseFloat(amount) < 0) {
        return res.status(400).json({ error: 'Le montant ne peut pas être négatif' });
      }

      const data = {
        amount: parseFloat(amount),
        category,
        date,
        description: description || null,
        mileage: mileage ? parseInt(mileage) : null,
      };

      const expense = await expenseService.create(data, vehicleId, req.userId);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await expenseService.delete(req.params.id, req.userId);
      res.json({ message: 'Dépense supprimée avec succès' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();
