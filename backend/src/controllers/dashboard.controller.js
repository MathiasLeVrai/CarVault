const dashboardService = require('../services/dashboard.service');
const storageService = require('../services/storage.service');

class DashboardController {
  async getData(req, res, next) {
    try {
      const data = await dashboardService.getData(req.userId);
      res.json(await storageService.signAssets(data));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
