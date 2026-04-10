const prisma = require('../lib/prisma');

// Stripe is optional — only initialized if STRIPE_SECRET_KEY is set
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const FREE_VEHICLE_LIMIT = 1;
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID || null,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY || null,
};

class StripeService {
  isConfigured() {
    return !!stripe && !!(PRICE_IDS.monthly || PRICE_IDS.yearly);
  }

  async getUserWithPremium(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isPremium: true, stripeCustomerId: true, stripeSubscriptionId: true, premiumExpiresAt: true },
    });
  }

  async checkVehicleLimit(userId) {
    const user = await this.getUserWithPremium(userId);
    if (!user) return { allowed: false };
    if (user.isPremium) return { allowed: true };

    const count = await prisma.vehicle.count({ where: { userId } });
    return { allowed: count < FREE_VEHICLE_LIMIT, count, limit: FREE_VEHICLE_LIMIT };
  }

  async createCheckoutSession(userId, plan, successUrl, cancelUrl) {
    if (!this.isConfigured()) {
      throw new Error('Stripe non configuré');
    }

    const priceId = PRICE_IDS[plan] || PRICE_IDS.yearly || PRICE_IDS.monthly;
    if (!priceId) {
      throw new Error('Aucun prix Stripe configuré pour ce plan');
    }

    const user = await this.getUserWithPremium(userId);

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
      allow_promotion_codes: true,
      subscription_data: { trial_period_days: 14 },
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(userId, returnUrl) {
    if (!this.isConfigured()) throw new Error('Stripe non configuré');

    const user = await this.getUserWithPremium(userId);
    if (!user.stripeCustomerId) throw new Error('Aucun compte Stripe associé');

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(payload, sig) {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook non configuré');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new Error('Signature webhook invalide');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId) break;
        await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            stripeSubscriptionId: session.subscription,
          },
        });
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { isPremium: false, stripeSubscriptionId: null },
        });
        break;
      }

      case 'customer.subscription.resumed':
      case 'invoice.payment_succeeded': {
        const sub = event.data.object;
        const subId = sub.subscription || sub.id;
        if (subId) {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { isPremium: true },
          });
        }
        break;
      }
    }

    return { received: true };
  }
}

module.exports = new StripeService();
