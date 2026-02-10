const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getData(req, res, next) {
    try {
      const data = await dashboardService.getData(req.userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
