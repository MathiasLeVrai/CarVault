const http2 = require('http2');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const prisma = require('../lib/prisma');

const APNS_PREFIX = 'apns:';
const APNS_TOKEN_TTL_MS = 50 * 60 * 1000; // Apple: max 60 min, refresh at 50.

class PushService {
  constructor() {
    this._configured = false;
    this._apnsToken = null;
    this._apnsTokenAt = 0;
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

  _apnsConfig() {
    const keyId = process.env.APNS_KEY_ID;
    const teamId = process.env.APNS_TEAM_ID;
    const privateKey = process.env.APNS_PRIVATE_KEY;
    const bundleId = process.env.APNS_BUNDLE_ID || 'fr.carvio.app';
    if (!keyId || !teamId || !privateKey) return null;
    return {
      keyId,
      teamId,
      bundleId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      host: process.env.APNS_PRODUCTION === '1'
        ? 'https://api.push.apple.com'
        : 'https://api.sandbox.push.apple.com',
    };
  }

  isNativeConfigured() {
    return Boolean(this._apnsConfig());
  }

  // Provider Authentication Token (JWT ES256), cached ~50 min.
  _apnsProviderToken(cfg) {
    const now = Date.now();
    if (this._apnsToken && now - this._apnsTokenAt < APNS_TOKEN_TTL_MS) {
      return this._apnsToken;
    }
    this._apnsToken = jwt.sign(
      { iss: cfg.teamId, iat: Math.floor(now / 1000) },
      cfg.privateKey,
      { algorithm: 'ES256', header: { alg: 'ES256', kid: cfg.keyId } },
    );
    this._apnsTokenAt = now;
    return this._apnsToken;
  }

  async subscribe(userId, subscription) {
    const { endpoint, keys } = subscription;
    await prisma.abonnementPush.upsert({
      where: { userId_endpoint: { userId, endpoint } },
      update: { p256dh: keys.p256dh, auth: keys.auth, platform: 'WEB' },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, platform: 'WEB' },
    });
  }

  async unsubscribe(userId, endpoint) {
    await prisma.abonnementPush.deleteMany({
      where: { userId, endpoint },
    });
  }

  // Native (Capacitor iOS) device token registration.
  async subscribeNative(userId, token) {
    const endpoint = `${APNS_PREFIX}${token}`;
    await prisma.abonnementPush.upsert({
      where: { userId_endpoint: { userId, endpoint } },
      update: { platform: 'IOS' },
      create: { userId, endpoint, platform: 'IOS' },
    });
  }

  async unsubscribeNative(userId, token) {
    await prisma.abonnementPush.deleteMany({
      where: { userId, endpoint: `${APNS_PREFIX}${token}` },
    });
  }

  async sendToUser(userId, title, body, url = '/alerts') {
    const subs = await prisma.abonnementPush.findMany({ where: { userId } });
    if (subs.length === 0) return 0;

    const webSubs = subs.filter((s) => s.platform === 'WEB');
    const iosSubs = subs.filter((s) => s.platform === 'IOS');

    let sent = 0;
    for (const sub of webSubs) {
      sent += await this._sendWeb(sub, title, body, url);
    }
    if (iosSubs.length > 0) {
      sent += await this._sendApnsBatch(iosSubs, title, body, url);
    }
    return sent;
  }

  async _sendWeb(sub, title, body, url) {
    if (!this.isConfigured()) return 0;
    if (!sub.p256dh || !sub.auth) return 0;
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, JSON.stringify({
        title,
        body,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        url,
      }));
      return 1;
    } catch (err) {
      // 410 Gone / 404 = subscription expired, clean up
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.abonnementPush.delete({ where: { id: sub.id } });
      }
      return 0;
    }
  }

  async _sendApnsBatch(subs, title, body, url) {
    const cfg = this._apnsConfig();
    if (!cfg) return 0;

    const providerToken = this._apnsProviderToken(cfg);
    const payload = JSON.stringify({
      aps: { alert: { title, body }, sound: 'default' },
      url,
    });

    const client = http2.connect(cfg.host);
    client.on('error', () => { /* handled per-request */ });

    let sent = 0;
    try {
      await Promise.all(subs.map((sub) => this._sendApnsOne(client, cfg, providerToken, payload, sub)
        .then((ok) => { if (ok) sent++; })));
    } finally {
      client.close();
    }
    return sent;
  }

  _sendApnsOne(client, cfg, providerToken, payload, sub) {
    return new Promise((resolve) => {
      const token = sub.endpoint.startsWith(APNS_PREFIX)
        ? sub.endpoint.slice(APNS_PREFIX.length)
        : sub.endpoint;

      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${token}`,
        'authorization': `bearer ${providerToken}`,
        'apns-topic': cfg.bundleId,
        'apns-push-type': 'alert',
        'content-type': 'application/json',
      });

      let status = 0;
      let data = '';
      req.on('response', (headers) => { status = headers[':status']; });
      req.setEncoding('utf8');
      req.on('data', (chunk) => { data += chunk; });
      req.on('error', () => resolve(false));
      req.on('end', async () => {
        if (status === 200) return resolve(true);
        // Invalid/expired token -> clean up.
        let reason = '';
        try { reason = JSON.parse(data).reason; } catch { /* ignore */ }
        if (status === 410 || reason === 'BadDeviceToken' || reason === 'Unregistered') {
          try { await prisma.abonnementPush.delete({ where: { id: sub.id } }); } catch { /* ignore */ }
        }
        resolve(false);
      });

      req.end(payload);
    });
  }
}

module.exports = new PushService();
