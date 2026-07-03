const prisma = require('../lib/prisma');

const BADGE_DEFS = [
  {
    id: 'first_vehicle',
    title: 'Premier pas',
    description: 'Ajoutez votre premier véhicule',
    icon: 'Car',
    color: '#ff2a3f',
  },
  {
    id: 'first_document',
    title: 'Bien rangé',
    description: 'Importez votre premier document',
    icon: 'FileText',
    color: '#7c5cfc',
  },
  {
    id: 'ct_added',
    title: 'Contrôle technique',
    description: 'Ajoutez votre CT au coffre-fort',
    icon: 'ShieldCheck',
    color: '#22c55e',
  },
  {
    id: 'first_fuel',
    title: 'Premier plein',
    description: 'Enregistrez votre premier plein',
    icon: 'Fuel',
    color: '#38bdf8',
  },
  {
    id: 'fuel_5',
    title: 'Régulier',
    description: '5 pleins enregistrés',
    icon: 'Fuel',
    color: '#38bdf8',
  },
  {
    id: 'fuel_streak_3',
    title: 'Série de 3',
    description: '3 mois de suite avec un plein enregistré',
    icon: 'Zap',
    color: '#f59e0b',
  },
  {
    id: 'first_expense',
    title: 'Comptabilité',
    description: 'Enregistrez votre première dépense',
    icon: 'Wallet',
    color: '#f59e0b',
  },
  {
    id: 'expense_10',
    title: 'Comptable pro',
    description: '10 dépenses enregistrées',
    icon: 'BarChart2',
    color: '#f59e0b',
  },
  {
    id: 'mileage_tracker',
    title: 'Kilométreur',
    description: '3 mises à jour du kilométrage',
    icon: 'Gauge',
    color: '#22c55e',
  },
  {
    id: 'multi_vehicle',
    title: 'Collectionneur',
    description: '2 véhicules ou plus dans le garage',
    icon: 'Car',
    color: '#7c5cfc',
  },
];

/**
 * Compute the fuel logging streak (consecutive months with at least 1 entry)
 */
async function computeFuelStreak(userId) {
  const entries = await prisma.entreeCarburant.findMany({
    where: { vehicle: { userId } },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  if (entries.length === 0) return 0;

  // Build a set of "YYYY-MM" strings
  const months = new Set(entries.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }));

  const now = new Date();
  let streak = 0;
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  // If current month has no entry, start from previous month
  if (!months.has(`${year}-${String(month).padStart(2, '0')}`)) {
    month -= 1;
    if (month === 0) { month = 12; year -= 1; }
  }

  while (months.has(`${year}-${String(month).padStart(2, '0')}`)) {
    streak += 1;
    month -= 1;
    if (month === 0) { month = 12; year -= 1; }
  }

  return streak;
}

class BadgeService {
  async getBadges(userId) {
    // Gather all relevant counts in parallel
    const [
      vehicleCount,
      documentCount,
      ctCount,
      fuelCount,
      expenseCount,
      mileageCount,
      fuelStreak,
    ] = await Promise.all([
      prisma.vehicule.count({ where: { userId } }),
      prisma.document.count({ where: { vehicle: { userId } } }),
      prisma.document.count({ where: { vehicle: { userId }, type: 'TECHNICAL_INSPECTION' } }),
      prisma.entreeCarburant.count({ where: { vehicle: { userId } } }),
      prisma.depense.count({ where: { vehicle: { userId } } }),
      prisma.entreeKilometrage.count({ where: { vehicle: { userId } } }),
      computeFuelStreak(userId),
    ]);

    const conditions = {
      first_vehicle:   vehicleCount >= 1,
      first_document:  documentCount >= 1,
      ct_added:        ctCount >= 1,
      first_fuel:      fuelCount >= 1,
      fuel_5:          fuelCount >= 5,
      fuel_streak_3:   fuelStreak >= 3,
      first_expense:   expenseCount >= 1,
      expense_10:      expenseCount >= 10,
      mileage_tracker: mileageCount >= 3,
      multi_vehicle:   vehicleCount >= 2,
    };

    const unlockedCount = Object.values(conditions).filter(Boolean).length;

    return {
      badges: BADGE_DEFS.map(b => ({
        ...b,
        unlocked: conditions[b.id] ?? false,
      })),
      unlockedCount,
      totalCount: BADGE_DEFS.length,
      fuelStreak,
    };
  }
}

module.exports = new BadgeService();
