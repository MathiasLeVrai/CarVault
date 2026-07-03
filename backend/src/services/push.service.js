const webpush = require('web-push');
const prisma = require('../lib/prisma');

class PushService {
  constructor() {
    this._configured = false;
  }

  _init() {
    if (this._configured) return;
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return;

    webpush.setVapidDetails(
      process.env.APP_URL || 'https://carvio.fr',
      publicKey,
      privateKey,
    );
    this._configured = true;
  }

  isConfigured() {
    this._init();
    return this._configured;
  }

  async subscribe(userId, subscription) {
    const { endpoint, keys } = subscription;
    await prisma.abonnementPush.upsert({
      where: { userId_endpoint: { userId, endpoint } },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
  }

  async unsubscribe(userId, endpoint) {
    await prisma.abonnementPush.deleteMany({
      where: { userId, endpoint },
    });
  }

  async sendToUser(userId, title, body, url = '/alerts') {
    if (!this.isConfigured()) return 0;

    const subs = await prisma.abonnementPush.findMany({ where: { userId } });
    let sent = 0;

    for (const sub of subs) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSub, JSON.stringify({
          title,
          body,
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          url,
        }));
        sent++;
      } catch (err) {
        // 410 Gone = subscription expired, clean up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.abonnementPush.delete({ where: { id: sub.id } });
        }
      }
    }
    return sent;
  }
}

module.exports = new PushService();
