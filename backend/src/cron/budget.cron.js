const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { alertExists, createAlert } = require('./helpers');
const fuelPriceService = require('../services/fuel-price.service');

/**
 * Alertes budget & statistiques — quotidien 9h
 *
 * Alertes persistantes (créées en BDD) :
 * 1. BUDGET_SPIKE         — Dépenses du mois > 150% de la moyenne
 * 2. COST_PER_KM          — Coût au km tous les 5 000 km
 * 3. FUEL_BUDGET_EXCEEDED — Dépassement budget carburant mensuel
 * 4. KM_RECORD            — Record de km parcourus dans un mois
 */

// ============================================================
// 1. Pic de dépense mensuel
// ============================================================

async function checkSpendingSpike() {
  let created = 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const vehicles = await prisma.vehicle.findMany({
    include: {
      user: { select: { id: true, email: true, firstName: true, notifEmail: true } },
    },
  });

  for (const v of vehicles) {
    // Current month total (expenses + fuel)
    const [expenseSum, fuelSum] = await Promise.all([
      prisma.expense.aggregate({
        where: { vehicleId: v.id, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.fuelEntry.aggregate({
        where: { vehicleId: v.id, date: { gte: startOfMonth } },
        _sum: { totalCost: true },
      }),
    ]);
    const currentTotal = (expenseSum._sum.amount || 0) + (fuelSum._sum.totalCost || 0);
    if (currentTotal <= 0) continue;

    // Average of previous 6 months
    const [prevExpenses, prevFuel] = await Promise.all([
      prisma.expense.aggregate({
        where: { vehicleId: v.id, date: { gte: sixMonthsAgo, lt: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.fuelEntry.aggregate({
        where: { vehicleId: v.id, date: { gte: sixMonthsAgo, lt: startOfMonth } },
        _sum: { totalCost: true },
      }),
    ]);
    const prevTotal = (prevExpenses._sum.amount || 0) + (prevFuel._sum.totalCost || 0);
    const monthlyAvg = prevTotal / 6;

    if (monthlyAvg <= 0 || currentTotal <= monthlyAvg * 1.5) continue;

    if (await alertExists(v.userId, 'BUDGET_SPIKE', v.brand, { since: startOfMonth })) continue;

    const ratio = Math.round((currentTotal / monthlyAvg) * 100);
    await createAlert({
      title: `Pic de dépense : ${v.brand} ${v.model}`,
      message: `Ce mois-ci vous avez dépensé ${Math.round(currentTotal)}€ sur votre ${v.brand} ${v.model}, soit ${ratio}% de votre moyenne habituelle (${Math.round(monthlyAvg)}€/mois).`,
      type: 'BUDGET_SPIKE',
      userId: v.userId,
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
    });
    created++;
  }

  return created;
}

// ============================================================
// 2. Coût au km (tous les 5 000 km)
// ============================================================

async function checkCostPerKm() {
  let created = 0;

  const vehicles = await prisma.vehicle.findMany({
    where: { mileage: { gt: 0 } },
    include: {
      user: { select: { id: true, email: true, firstName: true, notifEmail: true } },
    },
  });

  for (const v of vehicles) {
    const purchaseMileage = v.purchaseMileage ?? 0;
    const distanceSincePurchase = v.mileage - purchaseMileage;
    if (distanceSincePurchase <= 0) continue;

    // Only trigger at 5000 km milestones
    const milestone = Math.floor(distanceSincePurchase / 5000) * 5000;
    if (milestone === 0) continue;
    // Check if we already alerted for this milestone
    if (await alertExists(v.userId, 'COST_PER_KM', `${milestone.toLocaleString('fr-FR')} km`)) continue;

    // Total costs (all time)
    const [expenseTotal, fuelTotal] = await Promise.all([
      prisma.expense.aggregate({
        where: { vehicleId: v.id },
        _sum: { amount: true },
      }),
      prisma.fuelEntry.aggregate({
        where: { vehicleId: v.id },
        _sum: { totalCost: true },
      }),
    ]);

    const totalCost = (expenseTotal._sum.amount || 0) + (fuelTotal._sum.totalCost || 0);
    if (totalCost <= 0) continue;

    const costPerKm = (totalCost / distanceSincePurchase).toFixed(2);

    await createAlert({
      title: `Coût au km à ${milestone.toLocaleString('fr-FR')} km : ${v.brand} ${v.model}`,
      message: `Votre ${v.brand} ${v.model} vous revient à ${costPerKm}€/km (${Math.round(totalCost).toLocaleString('fr-FR')}€ pour ${distanceSincePurchase.toLocaleString('fr-FR')} km parcourus depuis l'achat à ${purchaseMileage.toLocaleString('fr-FR')} km).`,
      type: 'COST_PER_KM',
      userId: v.userId,
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
    });
    created++;
  }

  return created;
}

// ============================================================
// 3. Budget carburant mensuel dépassé
// ============================================================

async function checkFuelBudget() {
  let created = 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const vehicles = await prisma.vehicle.findMany({
    where: { monthlyFuelBudget: { not: null, gt: 0 } },
    include: {
      user: { select: { id: true, email: true, firstName: true, notifEmail: true } },
    },
  });

  for (const v of vehicles) {
    const fuelSum = await prisma.fuelEntry.aggregate({
      where: { vehicleId: v.id, date: { gte: startOfMonth } },
      _sum: { totalCost: true },
    });
    const fuelTotal = fuelSum._sum.totalCost || 0;

    if (fuelTotal <= v.monthlyFuelBudget) continue;
    if (await alertExists(v.userId, 'FUEL_BUDGET_EXCEEDED', v.brand, { since: startOfMonth })) continue;

    const overage = Math.round(fuelTotal - v.monthlyFuelBudget);
    await createAlert({
      title: `Budget carburant dépassé : ${v.brand} ${v.model}`,
      message: `Vous avez dépensé ${Math.round(fuelTotal)}€ en carburant ce mois-ci, soit +${overage}€ au-dessus de votre budget de ${Math.round(v.monthlyFuelBudget)}€.`,
      type: 'FUEL_BUDGET_EXCEEDED',
      userId: v.userId,
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
    });
    created++;
  }

  return created;
}

// ============================================================
// 4. Record de kilométrage mensuel
// ============================================================

async function checkKmRecord() {
  let created = 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfPrevMonth = new Date(startOfMonth.getTime() - 1);

  // Only run on the 1st of the month (checking last month's record)
  if (now.getDate() > 3) return 0;

  const vehicles = await prisma.vehicle.findMany({
    include: {
      user: { select: { id: true, email: true, firstName: true, notifEmail: true } },
    },
  });

  for (const v of vehicles) {
    // Get mileage entries to compute monthly km
    const entries = await prisma.mileageEntry.findMany({
      where: { vehicleId: v.id },
      orderBy: { date: 'asc' },
      select: { mileage: true, date: true },
    });
    if (entries.length < 3) continue;

    // Compute km per month
    const monthlyKm = {};
    for (let i = 1; i < entries.length; i++) {
      const key = `${entries[i].date.getFullYear()}-${entries[i].date.getMonth()}`;
      const km = entries[i].mileage - entries[i - 1].mileage;
      if (km > 0) {
        monthlyKm[key] = (monthlyKm[key] || 0) + km;
      }
    }

    const months = Object.entries(monthlyKm);
    if (months.length < 2) continue;

    // Last completed month
    const lastMonthKey = `${endOfPrevMonth.getFullYear()}-${endOfPrevMonth.getMonth()}`;
    const lastMonthKm = monthlyKm[lastMonthKey];
    if (!lastMonthKm) continue;

    // Check if it's the record
    const maxKm = Math.max(...months.filter(([k]) => k !== lastMonthKey).map(([, v]) => v));
    if (lastMonthKm <= maxKm) continue;

    if (await alertExists(v.userId, 'KM_RECORD', 'record', { since: startOfMonth })) continue;

    const monthName = endOfPrevMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    await createAlert({
      title: `Record km : ${v.brand} ${v.model}`,
      message: `Nouveau record : ${lastMonthKm.toLocaleString('fr-FR')} km parcourus en ${monthName} sur votre ${v.brand} ${v.model} !`,
      type: 'KM_RECORD',
      userId: v.userId,
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
    });
    created++;
  }

  return created;
}

// ============================================================
// 5. Baisse prix carburant
// ============================================================

const FUEL_TYPE_TO_GOV = {
  DIESEL:   ['Gazole'],
  GASOLINE: ['SP95', 'SP98', 'E10'],
  LPG:      ['GPLc'],
};

const FUEL_DISPLAY_NAMES = {
  Gazole: 'diesel',
  SP95: 'SP95',
  SP98: 'SP98',
  E10: 'SP95-E10',
  GPLc: 'GPL',
};

async function checkFuelPriceDrop() {
  let created = 0;

  const drops = await fuelPriceService.getPriceDrops();
  if (drops.length === 0) return 0;

  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);

  for (const drop of drops) {
    const matchingFuelTypes = Object.entries(FUEL_TYPE_TO_GOV)
      .filter(([, names]) => names.includes(drop.fuelName))
      .map(([ft]) => ft);
    if (matchingFuelTypes.length === 0) continue;

    const users = await prisma.user.findMany({
      where: {
        vehicles: { some: { fuelType: { in: matchingFuelTypes } } },
      },
      select: { id: true, email: true, firstName: true, notifEmail: true },
    });

    for (const u of users) {
      if (await alertExists(u.id, 'FUEL_PRICE_DROP', drop.fuelName, { since: weekStart })) continue;
      const displayName = FUEL_DISPLAY_NAMES[drop.fuelName] || drop.fuelName;
      const dropCents = Math.max(1, Math.round((drop.previousPrice - drop.currentPrice) * 100));
      const centsLabel = `${dropCents} centime${dropCents > 1 ? 's' : ''}`;

      await createAlert({
        title: `${displayName} en baisse`,
        message: `Le prix du ${displayName} a baissé de ${centsLabel} depuis la semaine dernière (${drop.previousPrice.toFixed(3)}€ → ${drop.currentPrice.toFixed(3)}€). C'est peut-être le bon moment pour faire le plein.`,
        type: 'FUEL_PRICE_DROP',
        userId: u.id,
      }, {
        email: u.notifEmail !== false ? u.email : null,
        userName: u.firstName,
      });
      created++;
    }
  }

  return created;
}

// ============================================================
// Orchestrateur
// ============================================================

async function runBudgetChecks() {
  console.log('[CRON] Lancement vérification budget & stats...');

  try {
    const spikeAlerts = await checkSpendingSpike();
    const costAlerts = await checkCostPerKm();
    const fuelAlerts = await checkFuelBudget();
    const kmAlerts = await checkKmRecord();
    const priceAlerts = await checkFuelPriceDrop();

    const total = spikeAlerts + costAlerts + fuelAlerts + kmAlerts + priceAlerts;
    console.log(`[CRON] ${total} alerte(s) budget — Pic: ${spikeAlerts}, Coût/km: ${costAlerts}, Budget fuel: ${fuelAlerts}, Record: ${kmAlerts}, Prix fuel: ${priceAlerts}`);
  } catch (error) {
    console.error('[CRON] Erreur budget :', error.message);
  }
}

function startBudgetCron() {
  // Every day at 9am
  cron.schedule('0 9 * * *', () => runBudgetChecks());
  console.log('[CRON] Budget & stats activées (quotidien 9h).');
}

module.exports = { startBudgetCron };
