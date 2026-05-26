const Sentry = require('./instrument');

const express = require('express');
const cors = require('cors');
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
const { errorHandler } = require('./middleware/error.middleware');
const { startAlertCron } = require('./cron/alert.cron');
const { startMonthlyReportCron } = require('./cron/monthly-report.cron');
const { startWeeklyDigestCron } = require('./cron/weekly-digest.cron');
const { startEngagementCron } = require('./cron/engagement.cron');
const { startBudgetCron } = require('./cron/budget.cron');

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
  if (req.path.startsWith('/api/subscription/webhook')) return next();
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
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de comptes créés depuis cette adresse. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
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

app.use(helmet({
  contentSecurityPolicy: false, // CSP géré par Vite/frontend
  crossOriginEmbedderPolicy: false, // Permet le chargement des images externes (map tiles, etc.)
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Autorise l'app Capacitor à afficher /uploads depuis carvio.fr
}));

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin in prod)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));

// Stripe webhook needs raw body — must be registered BEFORE express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve uploaded files (UUID filenames — unguessable, consistent with R2 public URLs in prod)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting global sur toutes les routes API
app.use('/api', apiLimiter);

// Rate limiters spécifiques (plus restrictifs, appliqués en plus du global)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', registerLimiter);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI — documentation OpenAPI (désactiver avec SWAGGER_ENABLED=false)
if (process.env.SWAGGER_ENABLED !== 'false') {
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
  startAlertCron();
  startMonthlyReportCron();
  startWeeklyDigestCron();
  startEngagementCron();
  startBudgetCron();
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
