const alertService = require('../services/alert.service');

class AlertController {
  async getAll(req, res, next) {
    try {
      const onlyUnread = req.query.unread === 'true';
      const alerts = await alertService.getAll(req.userId, onlyUnread);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }

  async countUnread(req, res, next) {
    try {
      const count = await alertService.countUnread(req.userId);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const alert = await alertService.markAsRead(req.params.id, req.userId);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await alertService.markAllAsRead(req.userId);
      res.json({ message: 'Toutes les alertes ont été marquées comme lues' });
    } catch (error) {
      next(error);
    }
  }

  async checkExpiring(req, res, next) {
    try {
      const alerts = await alertService.checkExpiringDocuments(req.userId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await alertService.delete(req.params.id, req.userId);
      res.json({ message: 'Alerte supprimée' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlertController();
