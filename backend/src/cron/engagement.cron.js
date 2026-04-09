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

// ── Check 4: Tire wear (no TIRES expense in 1 year) ──
async function checkTireWear(userId) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    select: { id: true, brand: true, model: true, fuelType: true },
  });
  if (vehicles.length === 0) return null;

  // Skip electric vehicles (often on all-season tires)
  const nonElectric = vehicles.filter(v => v.fuelType !== 'ELECTRIC');
  if (nonElectric.length === 0) return null;

  const recentTires = await prisma.expense.findFirst({
    where: {
      vehicleId: { in: nonElectric.map(v => v.id) },
      category: 'TIRES',
      date: { gte: oneYearAgo },
    },
    select: { id: true },
  });

  if (!recentTires) {
    const v = nonElectric[0];
    return {
      title: 'CarVault — Pneus à surveiller',
      body: `Aucun entretien pneus enregistré depuis 1 an sur votre ${v.brand} ${v.model}. Vérifiez profondeur, pression et usure.`,
      url: '/expenses',
    };
  }
  return null;
}

// ── Check 5: CO2 malus warning ──
async function checkCO2Malus(userId) {
  // Barème 2026 : malus à partir de 118 g/km
  const CO2_MALUS_THRESHOLD = 118;

  const vehicle = await prisma.vehicle.findFirst({
    where: { userId, co2: { not: null, gt: CO2_MALUS_THRESHOLD } },
    select: { brand: true, model: true, co2: true },
  });

  if (vehicle) {
    return {
      title: 'CarVault — Malus CO2',
      body: `Votre ${vehicle.brand} ${vehicle.model} émet ${vehicle.co2} g/km. Ce véhicule entre dans la tranche malus 2026 (seuil ${CO2_MALUS_THRESHOLD} g/km).`,
      url: '/vehicles',
    };
  }
  return null;
}

// ── Check 6: Missing vehicle photo ──
async function checkMissingPhoto(userId) {
  const vehicleWithoutPhoto = await prisma.vehicle.findFirst({
    where: { userId, photo: null },
    select: { brand: true, model: true, id: true },
  });

  if (vehicleWithoutPhoto) {
    return {
      title: 'CarVault — Photo manquante',
      body: `Ajoutez une photo de votre ${vehicleWithoutPhoto.brand} ${vehicleWithoutPhoto.model} pour compléter sa fiche.`,
      url: `/vehicles/${vehicleWithoutPhoto.id}`,
    };
  }
  return null;
}

// ── Check 7: Inefficient fuel fill ──
async function checkFuelEfficiency(userId) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { userId },
    select: { id: true, brand: true, model: true },
  });
  if (!vehicle) return null;

  // Get full fills (isFull=true) ordered by date, need at least 3 to compute avg
  const fills = await prisma.fuelEntry.findMany({
    where: { vehicleId: vehicle.id, isFull: true },
    orderBy: { date: 'desc' },
    take: 10,
    select: { liters: true, mileage: true, date: true },
  });
  if (fills.length < 3) return null;

  // Compute consumption for consecutive full fills
  const consumptions = [];
  for (let i = 0; i < fills.length - 1; i++) {
    const kmDiff = fills[i].mileage - fills[i + 1].mileage;
    if (kmDiff > 0) {
      consumptions.push((fills[i].liters / kmDiff) * 100);
    }
  }
  if (consumptions.length < 2) return null;

  const lastConsumption = consumptions[0];
  const avgConsumption = consumptions.slice(1).reduce((s, c) => s + c, 0) / (consumptions.length - 1);

  if (lastConsumption > avgConsumption * 1.2) {
    return {
      title: 'CarVault — Consommation inhabituelle',
      body: `Dernier plein : ${lastConsumption.toFixed(1)} L/100km vs moyenne ${avgConsumption.toFixed(1)} L/100km sur votre ${vehicle.brand} ${vehicle.model}. Vérifiez pression pneus ou style de conduite.`,
      url: `/vehicles/${vehicle.id}`,
    };
  }
  return null;
}

// ── Check 8: Annual km goal progress ──
async function checkAnnualKmGoal(userId) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { userId, annualKmGoal: { not: null } },
    select: { id: true, brand: true, model: true, annualKmGoal: true },
  });
  if (!vehicle) return null;

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Get mileage at start of year (closest entry)
  const startEntry = await prisma.mileageEntry.findFirst({
    where: { vehicleId: vehicle.id, date: { gte: startOfYear } },
    orderBy: { date: 'asc' },
    select: { mileage: true },
  });

  const latestEntry = await prisma.mileageEntry.findFirst({
    where: { vehicleId: vehicle.id },
    orderBy: { date: 'desc' },
    select: { mileage: true },
  });

  if (!startEntry || !latestEntry) return null;

  const kmDone = latestEntry.mileage - startEntry.mileage;
  const pct = Math.round((kmDone / vehicle.annualKmGoal) * 100);
  const remaining = Math.max(0, vehicle.annualKmGoal - kmDone);

  if (pct > 0) {
    return {
      title: `CarVault — Objectif km ${vehicle.brand} ${vehicle.model}`,
      body: `Vous êtes à ${pct}% de votre objectif annuel (${kmDone.toLocaleString('fr-FR')} / ${vehicle.annualKmGoal.toLocaleString('fr-FR')} km). ${remaining > 0 ? `${remaining.toLocaleString('fr-FR')} km restants.` : 'Objectif atteint !'}`,
      url: `/vehicles/${vehicle.id}`,
    };
  }
  return null;
}

// ── Check 9: Monthly cost insight (1st of month only) ──
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
      checkFuelEfficiency,
      checkTireWear,
      checkFewDocuments,
      checkMissingPhoto,
      checkCO2Malus,
      checkAnnualKmGoal,
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
