const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.includes('connect_timeout')
        ? process.env.DATABASE_URL
        : `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}connect_timeout=30&pool_timeout=30`,
    },
  },
});

// Keep Neon awake — ping every 4 minutes to prevent cold starts
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000;
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    // Ignore — next real request will retry
  }
}, KEEP_ALIVE_INTERVAL);

module.exports = prisma;
