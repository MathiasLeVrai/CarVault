const cron = require('node-cron');
const prisma = require('../lib/prisma');
const pushService = require('../services/push.service');

/**
 * Notifications d'engagement — quotidien 10h
 * Max 1 notification par utilisateur par jour, push uniquement.
 * Ne cree PAS d'alerte en base — ce sont des nudges ephemeres.
 */

// In-memory rate limit (resets on restart, acceptable for best-effort nudges)
const lastSentMap = new Map();

function alreadySentToday(userId) {
  const last = lastSentMap.get(userId);
  if (!last) return false;
  return new Date().toDateString() === last.toDateString();
}

function markSent(userId) {
  lastSentMap.set(userId, new Date());
}

// ── Check 1: No expense in 14 days ──
async function checkNoRecentExpense(userId) {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    select: { id: true },
  });
  if (vehicles.length === 0) return null;

  const vehicleIds = vehicles.map(v => v.id);

  const recent = await prisma.expense.findFirst({
    where: { vehicleId: { in: vehicleIds }, createdAt: { gte: twoWeeksAgo } },
    select: { id: true },
  });

  if (!recent) {
    return {
      title: 'CarVault — Dépenses à jour ?',
      body: 'Pas de dépense enregistrée depuis 2 semaines. Entretien, plein, péage… pensez à mettre à jour !',
      url: '/expenses',
    };
  }
  return null;
}

// ── Check 2: No mileage/fuel entry in 30 days ──
async function checkNoRecentMileage(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    select: { id: true },
  });
  if (vehicles.length === 0) return null;

  const vehicleIds = vehicles.map(v => v.id);

  const recentFuel = await prisma.fuelEntry.findFirst({
    where: { vehicleId: { in: vehicleIds }, createdAt: { gte: thirtyDaysAgo } },
    select: { id: true },
  });

  const recentMileage = await prisma.mileageEntry.findFirst({
    where: { vehicleId: { in: vehicleIds }, createdAt: { gte: thirtyDaysAgo } },
    select: { id: true },
  });

  if (!recentFuel && !recentMileage) {
    return {
      title: 'CarVault — Kilométrage',
      body: 'Vous avez roulé récemment ? Mettez à jour votre kilométrage pour un suivi précis.',
      url: '/vehicles',
    };
  }
  return null;
}

// ── Check 3: Few documents (<2) ──
async function checkFewDocuments(userId) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    select: { id: true },
  });
  if (vehicles.length === 0) return null;

  const count = await prisma.document.count({
    where: { vehicleId: { in: vehicles.map(v => v.id) } },
  });

  if (count < 2) {
    return {
      title: 'CarVault — Documents',
      body: 'Ajoutez vos documents importants (assurance, CT, carte grise) pour ne rien oublier.',
      url: '/documents',
    };
  }
  return null;
}

// ── Check 4: Monthly cost insight (1st of month only) ──
async function checkMonthlyCostInsight(userId) {
  const now = new Date();
  if (now.getDate() !== 1) return null;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const vehicle = await prisma.vehicle.findFirst({
    where: { userId },
    select: { id: true, brand: true, model: true },
  });
  if (!vehicle) return null;

  const expenses = await prisma.expense.aggregate({
    where: { vehicleId: vehicle.id, date: { gte: threeMonthsAgo } },
    _sum: { amount: true },
  });

  const fuel = await prisma.fuelEntry.aggregate({
    where: { vehicleId: vehicle.id, date: { gte: threeMonthsAgo } },
    _sum: { totalCost: true },
  });

  const total = (expenses._sum.amount || 0) + (fuel._sum.totalCost || 0);
  if (total <= 0) return null;

  const monthly = Math.round(total / 3);

  return {
    title: `CarVault — Bilan ${vehicle.brand} ${vehicle.model}`,
    body: `Votre ${vehicle.brand} ${vehicle.model} vous coûte environ ${monthly}€/mois en moyenne. Consultez le détail.`,
    url: `/vehicles/${vehicle.id}`,
  };
}

// ── Orchestrator ──
async function runEngagementChecks() {
  if (!pushService.isConfigured()) {
    console.log('[CRON] Engagement: push non configuré, skip.');
    return;
  }

  console.log('[CRON] Engagement notifications...');

  const users = await prisma.user.findMany({
    where: {
      notifPush: true,
      vehicles: { some: {} },
    },
    select: { id: true },
  });

  let sent = 0;

  for (const user of users) {
    if (alreadySentToday(user.id)) continue;

    // Try checks in priority order — send only the first match
    const checks = [
      checkNoRecentExpense,
      checkNoRecentMileage,
      checkFewDocuments,
      checkMonthlyCostInsight,
    ];

    for (const check of checks) {
      try {
        const notif = await check(user.id);
        if (notif) {
          await pushService.sendToUser(user.id, notif.title, notif.body, notif.url);
          markSent(user.id);
          sent++;
          break;
        }
      } catch {
        // Best-effort — skip this check
      }
    }
  }

  console.log(`[CRON] Engagement: ${sent} notification(s) envoyée(s).`);
}

function startEngagementCron() {
  // Every day at 10am
  cron.schedule('0 10 * * *', () => {
    runEngagementChecks().catch(err => {
      console.error('[CRON] Engagement error:', err.message);
    });
  });
  console.log('[CRON] Engagement notifications activées (quotidien 10h).');
}

module.exports = { startEngagementCron, runEngagementChecks };
