const badgeService = require('../services/badge.service');

class BadgeController {
  async getBadges(req, res, next) {
    try {
      const result = await badgeService.getBadges(req.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BadgeController();
