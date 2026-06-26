const stripeService = require('../services/stripe.service');
const revenueCatService = require('../services/revenuecat.service');

const IOS_NATIVE_CLIENT = 'ios-native';

class SubscriptionController {
  async getStatus(req, res, next) {
    try {
      const user = await stripeService.getUserWithPremium(req.userId);
      res.json({
        isPremium: user.isPremium,
        hasStripe: stripeService.isConfigured(),
        hasAppleIap: revenueCatService.isConfigured(),
        premiumSource: user.premiumSource || null,
        premiumExpiresAt: user.premiumExpiresAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCheckout(req, res, next) {
    try {
      if (req.headers['x-carvio-client'] === IOS_NATIVE_CLIENT) {
        return res.status(403).json({
          error: 'Sur iOS, l\'abonnement Premium doit être acheté via l\'App Store.',
        });
      }

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
      if (req.headers['x-carvio-client'] === IOS_NATIVE_CLIENT) {
        return res.status(403).json({
          error: 'Gérez votre abonnement iOS depuis Réglages > Apple ID > Abonnements.',
        });
      }

      const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
      const result = await stripeService.createPortalSession(req.userId, `${origin}/dashboard`);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async syncApple(req, res, next) {
    try {
      const premium = await revenueCatService.syncUserPremium(req.userId);
      res.json(premium);
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

  async revenueCatWebhook(req, res, _next) {
    try {
      let body = req.body;
      if (Buffer.isBuffer(body)) {
        body = JSON.parse(body.toString('utf8'));
      }
      const result = await revenueCatService.handleWebhook(body, req.headers.authorization);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SubscriptionController();
