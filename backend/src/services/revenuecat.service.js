const prisma = require('../lib/prisma');

const ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID || 'premium';
const API_BASE = 'https://api.revenuecat.com/v1';

class RevenueCatService {
  isConfigured() {
    return Boolean(process.env.REVENUECAT_SECRET_API_KEY);
  }

  getAuthHeader() {
    return `Bearer ${process.env.REVENUECAT_SECRET_API_KEY}`;
  }

  async fetchSubscriber(appUserId) {
    if (!this.isConfigured()) {
      throw new Error('RevenueCat non configuré');
    }

    const response = await fetch(`${API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RevenueCat API ${response.status}: ${text}`);
    }

    return response.json();
  }

  parsePremiumFromSubscriber(payload) {
    const entitlement = payload?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    if (!entitlement) {
      return { isPremium: false, premiumExpiresAt: null };
    }

    const expiresDate = entitlement.expires_date;
    const isPremium = expiresDate ? new Date(expiresDate).getTime() > Date.now() : true;

    return {
      isPremium,
      premiumExpiresAt: expiresDate ? new Date(expiresDate) : null,
    };
  }

  async syncUserPremium(userId) {
    const payload = await this.fetchSubscriber(userId);
    const premium = this.parsePremiumFromSubscriber(payload);

    await prisma.utilisateur.update({
      where: { id: userId },
      data: {
        isPremium: premium.isPremium,
        premiumExpiresAt: premium.premiumExpiresAt,
        premiumSource: premium.isPremium ? 'apple' : null,
      },
    });

    return premium;
  }

  async handleWebhook(body, authorization) {
    const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
    if (expected) {
      const token = String(authorization || '').replace(/^Bearer\s+/i, '');
      if (token !== expected) {
        throw new Error('Webhook RevenueCat non autorisé');
      }
    }

    const event = body?.event;
    if (!event?.app_user_id) {
      return { received: true, ignored: true };
    }

    const userId = event.app_user_id;
    const user = await prisma.utilisateur.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return { received: true, ignored: true };
    }

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE':
      case 'SUBSCRIPTION_EXTENDED':
      case 'TEMPORARY_ENTITLEMENT_GRANT':
        await this.syncUserPremium(userId);
        break;

      case 'EXPIRATION':
        await prisma.utilisateur.update({
          where: { id: userId },
          data: { isPremium: false, premiumExpiresAt: null, premiumSource: null },
        });
        break;

      case 'CANCELLATION':
        // L'accès reste actif jusqu'à expiration_at_ms ; EXPIRATION fermera le compte.
        if (event.expiration_at_ms) {
          await prisma.utilisateur.update({
            where: { id: userId },
            data: {
              isPremium: true,
              premiumExpiresAt: new Date(event.expiration_at_ms),
              premiumSource: 'apple',
            },
          });
        }
        break;

      default:
        break;
    }

    return { received: true };
  }
}

module.exports = new RevenueCatService();
