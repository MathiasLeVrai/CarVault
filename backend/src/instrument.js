if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  const isDev = process.env.NODE_ENV === 'development';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: isDev ? 1.0 : 0.2,
    sendDefaultPii: false,
    includeLocalVariables: isDev,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
}

module.exports = Sentry;
