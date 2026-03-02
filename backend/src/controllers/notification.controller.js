const notificationService = require('../services/notification.service');

class NotificationController {
  async getPreferences(req, res, next) {
    try {
      const prefs = await notificationService.getPreferences(req.userId);
      res.json(prefs);
    } catch (error) { next(error); }
  }

  async updatePreferences(req, res, next) {
    try {
      const prefs = await notificationService.updatePreferences(req.userId, req.body);
      res.json(prefs);
    } catch (error) { next(error); }
  }
}

module.exports = new NotificationController();
