const stripeService = require('../services/stripe.service');

class SubscriptionController {
  async getStatus(req, res, next) {
    try {
      const user = await stripeService.getUserWithPremium(req.userId);
      res.json({
        isPremium: user.isPremium,
        hasStripe: stripeService.isConfigured(),
      });
    } catch (error) {
      next(error);
    }
  }

  async createCheckout(req, res, next) {
    try {
      const plan = req.body.plan === 'monthly' ? 'monthly' : 'yearly';
      const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
      const result = await stripeService.createCheckoutSession(
        req.userId,
        plan,
        `${origin}/dashboard?upgraded=1`,
        `${origin}/upgrade?cancelled=1`,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPortal(req, res, next) {
    try {
      const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
      const result = await stripeService.createPortalSession(req.userId, `${origin}/dashboard`);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async webhook(req, res, _next) {
    try {
      const sig = req.headers['stripe-signature'];
      const result = await stripeService.handleWebhook(req.body, sig);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SubscriptionController();
