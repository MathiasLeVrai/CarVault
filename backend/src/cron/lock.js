const crypto = require('crypto');
const prisma = require('../lib/prisma');

let tableReady = false;

async function ensureLockTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS cron_locks (
      name TEXT PRIMARY KEY,
      locked_until TIMESTAMPTZ NOT NULL,
      locked_by TEXT
    )
  `);
  tableReady = true;
}

/**
 * Distributed cron mutex via a small lock table (pool-safe, unlike session advisory locks).
 * Expired locks can be stolen. Owner deletes its row on release.
 */
async function withCronLock(name, fn, ttlMinutes = 45) {
  await ensureLockTable();
  const now = new Date();
  const until = new Date(now.getTime() + ttlMinutes * 60_000);
  const owner = `${process.pid}-${crypto.randomBytes(4).toString('hex')}`;

  const claimed = await prisma.$queryRaw`
    INSERT INTO cron_locks (name, locked_until, locked_by)
    VALUES (${name}, ${until}, ${owner})
    ON CONFLICT (name) DO UPDATE
      SET locked_until = EXCLUDED.locked_until,
          locked_by = EXCLUDED.locked_by
      WHERE cron_locks.locked_until < ${now}
    RETURNING name
  `;

  if (!claimed?.length) {
    console.log(`[CRON] ${name}: lock held elsewhere — skip`);
    return { skipped: true };
  }

  try {
    const result = await fn();
    return { skipped: false, result };
  } finally {
    try {
      await prisma.$executeRaw`
        DELETE FROM cron_locks WHERE name = ${name} AND locked_by = ${owner}
      `;
    } catch (err) {
      console.error(`[CRON] ${name}: unlock failed:`, err.message);
    }
  }
}

module.exports = { withCronLock };
