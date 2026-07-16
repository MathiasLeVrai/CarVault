/**
 * Dedicated cron worker process.
 * Usage: node src/worker.js  (or npm run worker)
 *
 * API processes should leave RUN_CRONS unset/false in multi-instance prod.
 */
require('./instrument');

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const { startAllCrons } = require('./cron/runner');

console.log('[WORKER] Carvio cron worker starting…');
startAllCrons();

process.on('unhandledRejection', (reason) => {
  console.error('[WORKER FATAL] Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[WORKER FATAL] Uncaught exception:', err);
  process.exit(1);
});
