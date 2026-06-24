const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-for-feedback-flow';

// --- Isole la base de données (Neon indisponible en local) ---
const prismaPath = require.resolve('../src/lib/prisma');
const fakeUser = { email: 'jean.test@carvio.fr', firstName: 'Jean', lastName: 'Test' };
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: {
    user: { findUnique: async () => fakeUser },
  },
};

// --- Isole le transport email (pas d'appel réseau Resend/SMTP) ---
const emailService = require('../src/services/email.service');
let lastMail = null;
let mailShouldSucceed = true;
emailService._sendMailDual = async (to, subject, html) => {
  lastMail = { to, subject, html };
  return mailShouldSucceed;
};

const feedbackRoutes = require('../src/routes/feedback.routes');
const { errorHandler } = require('../src/middleware/error.middleware');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use('/api/feedback', feedbackRoutes);
app.use(errorHandler);

const server = http.createServer(app);
const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET, { expiresIn: '15m' });

const call = (body, headers = {}) =>
  new Promise((resolve) => {
    const { port } = server.address();
    const payload = body === undefined ? '' : JSON.stringify(body);
    const req = http.request(
      { host: '127.0.0.1', port, path: '/api/feedback', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
      },
    );
    req.end(payload);
  });

test.before(() => new Promise((r) => server.listen(0, r)));
test.after(() => new Promise((r) => server.close(r)));

test.beforeEach(() => { lastMail = null; mailShouldSucceed = true; });

test('refuse sans authentification (401)', async () => {
  const res = await call({ message: 'Une super idée pour Carvio' }, { Authorization: '' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(lastMail, null);
});

test('refuse une idée trop courte (400)', async () => {
  const res = await call({ message: 'hi' }, { Authorization: `Bearer ${token}` });
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /trop courte/i);
  assert.strictEqual(lastMail, null);
});

test('refuse une idée trop longue (400)', async () => {
  const res = await call({ message: 'a'.repeat(2001) }, { Authorization: `Bearer ${token}` });
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /trop longue/i);
  assert.strictEqual(lastMail, null);
});

test('envoie une idée valide (200) avec le bon destinataire et contenu', async () => {
  process.env.FEEDBACK_EMAIL = 'hello@carvio.fr';
  const res = await call(
    { message: 'Ajouter un rappel pour le contrôle technique' },
    { Authorization: `Bearer ${token}` },
  );
  assert.strictEqual(res.status, 200);
  assert.match(res.body.message, /merci/i);
  assert.ok(lastMail, 'un email doit être envoyé');
  assert.strictEqual(lastMail.to, 'hello@carvio.fr');
  assert.match(lastMail.subject, /jean\.test@carvio\.fr/);
  assert.match(lastMail.html, /Ajouter un rappel pour le contrôle technique/);
  assert.match(lastMail.html, /jean\.test@carvio\.fr/);
});

test('échappe le HTML pour éviter toute injection dans l\'email', async () => {
  const res = await call(
    { message: '<script>alert(1)</script> idée piégée' },
    { Authorization: `Bearer ${token}` },
  );
  assert.strictEqual(res.status, 200);
  assert.doesNotMatch(lastMail.html, /<script>alert\(1\)<\/script>/);
  assert.match(lastMail.html, /&lt;script&gt;/);
});

test('renvoie 502 si l\'envoi email échoue', async () => {
  mailShouldSucceed = false;
  const res = await call(
    { message: 'Idée valide mais email KO' },
    { Authorization: `Bearer ${token}` },
  );
  assert.strictEqual(res.status, 502);
  assert.match(res.body.error, /réessayez/i);
});
