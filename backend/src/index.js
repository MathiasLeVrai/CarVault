const Sentry = require('./instrument');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Validate required env vars at startup
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const emailService = require('./services/email.service');
emailService.logStartupHint();

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const documentRoutes = require('./routes/document.routes');
const expenseRoutes = require('./routes/expense.routes');
const alertRoutes = require('./routes/alert.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const brandRoutes = require('./routes/brand.routes');
const mileageRoutes = require('./routes/mileage.routes');
const fuelRoutes = require('./routes/fuel.routes');
const shareRoutes = require('./routes/share.routes');
const notificationRoutes = require('./routes/notification.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const badgeRoutes = require('./routes/badge.routes');
const pushRoutes = require('./routes/push.routes');
const coteRoutes = require('./routes/cote.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const mapRoutes = require('./routes/map.routes');
const mediaRoutes = require('./routes/media.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { startAllCrons } = require('./cron/runner');

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || (process.env.NODE_ENV === 'production' ? 8080 : 3001);
if (!Number.isFinite(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`[FATAL] Invalid PORT: ${process.env.PORT}`);
  process.exit(1);
}

// Ancienne URL Fly → domaine canonique (navigateurs, liens partagés). Ne pas rediriger le webhook Stripe
// (POST + 301 peut faire perdre le corps côté client).
app.use((req, res, next) => {
  if (req.hostname !== 'carvault.fly.dev') return next();
  if (req.path.startsWith('/api/subscription/webhook')
    || req.path.startsWith('/api/subscription/revenuecat-webhook')) return next();
  let host = 'carvio.fr';
  try {
    if (process.env.APP_URL) host = new URL(process.env.APP_URL).host;
  } catch {
    /* garde carvio.fr */
  }
  return res.redirect(301, `https://${host}${req.originalUrl}`);
});

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 10,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5,
  message: { error: 'Trop de comptes créés depuis cette adresse. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10_000 : 30,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10_000 : 60,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Trop d\'idées envoyées. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS — allow configured web origins plus native Capacitor origins.
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174'];
const nativeAppOrigins = [
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
];
const allowedOrigins = [...new Set([...configuredOrigins, ...nativeAppOrigins])];

// Storage origins allowed in CSP (R2 public CDN and/or S3-compatible endpoint for presigned URLs)
const storageOrigins = new Set();
try {
  if (process.env.STORAGE_PUBLIC_URL) {
    storageOrigins.add(new URL(process.env.STORAGE_PUBLIC_URL).origin);
  }
  if (process.env.R2_PUBLIC_URL) {
    storageOrigins.add(new URL(process.env.R2_PUBLIC_URL).origin);
  }
} catch {
  /* ignore invalid URL */
}
if (process.env.R2_ACCOUNT_ID) {
  storageOrigins.add(`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
}
const storageOriginList = [...storageOrigins];

app.use(helmet({
  // CSP applies to HTML served by this app (SPA in prod). Blocks injected scripts.
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://plausible.io'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://api.fontshare.com'],
      fontSrc: ["'self'", 'https://api.fontshare.com', 'https://cdn.fontshare.com', 'data:'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.basemaps.cartocdn.com',
        'https://*.openstreetmap.org',
        ...storageOriginList,
      ],
      connectSrc: [
        "'self'",
        'https://plausible.io',
        'https://*.ingest.sentry.io',
        'https://*.ingest.de.sentry.io',
        ...storageOriginList,
      ],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Permet le chargement des images externes (map tiles, etc.)
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Capacitor / médias cross-origin
}));

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin in prod)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));

// Webhooks need raw body — must be registered BEFORE express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use('/api/subscription/revenuecat-webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Uploads are private: local files via signed /api/media, R2 via presigned URLs

// Rate limiting global sur toutes les routes API
app.use('/api', apiLimiter);

// Rate limiters spécifiques (plus restrictifs, appliqués en plus du global)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', registerLimiter);
app.use('/api/feedback', feedbackLimiter);
app.use('/api/share', publicLimiter);
app.use('/api/brands/plate', publicLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/vehicles/:vehicleId/mileage', mileageRoutes);
app.use('/api/vehicles/:vehicleId/fuel', fuelRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/cote', coteRoutes);  // GET /api/cote/:vehicleId
app.use('/api/feedback', feedbackRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/media', mediaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI — désactivé en production par défaut (forcer avec SWAGGER_ENABLED=true).
const swaggerEnabled = process.env.SWAGGER_ENABLED
  ? process.env.SWAGGER_ENABLED === 'true'
  : process.env.NODE_ENV !== 'production';
if (swaggerEnabled) {
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const openapiPath = path.join(__dirname, 'docs/openapi.yaml');
  const openapiDocument = YAML.load(openapiPath);
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Carvio API',
    }),
  );
  app.get('/api/docs.json', (_req, res) => {
    res.json(openapiDocument);
  });
}

// Sentry error handler (must be before custom error handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handler
app.use(errorHandler);

// --- Production: serve frontend static build ---
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath, {
  setHeaders(res, filePath) {
    // Vite hashed assets — cache for 1 year
    if (filePath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// SPA fallback — any non-API route serves index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚗 Carvio API listening on http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);

  // Crons: default ON in non-production; OFF in production unless RUN_CRONS=1.
  // Prefer a dedicated worker (`npm run worker` / node src/worker.js) in multi-instance prod.
  const runCronsExplicit = process.env.RUN_CRONS;
  const shouldRunCrons = runCronsExplicit === '1' || runCronsExplicit === 'true'
    || ((runCronsExplicit !== '0' && runCronsExplicit !== 'false')
      && process.env.NODE_ENV !== 'production');

  if (shouldRunCrons) {
    startAllCrons();
  } else {
    console.log('[CRON] Skipped in API process (use worker.js or set RUN_CRONS=1)');
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
  if (process.env.SENTRY_DSN) {
    try { Sentry.captureException(reason); } catch { /* ignore */ }
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  if (process.env.SENTRY_DSN) {
    try { Sentry.captureException(err); } catch { /* ignore */ }
  }
  process.exit(1);
});

module.exports = app;
