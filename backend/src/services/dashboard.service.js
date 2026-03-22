const prisma = require('../lib/prisma');
const healthService = require('./health.service');

class DashboardService {
  async getData(userId) {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const now = new Date();

    const vehicleCount = await prisma.vehicle.count({ where: { userId } });

    const yearExpenses = await prisma.expense.aggregate({
      where: { vehicle: { userId }, date: { gte: yearStart } },
      _sum: { amount: true },
    });

    const monthlyExpenses = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM e.date) as month,
        SUM(e.amount) as total
      FROM expenses e
      JOIN vehicles v ON e."vehicleId" = v.id
      WHERE v."userId" = ${userId}
        AND e.date >= ${yearStart}
      GROUP BY EXTRACT(MONTH FROM e.date)
      ORDER BY month
    `;

    const upcomingDeadlines = await prisma.document.findMany({
      where: { vehicle: { userId }, expirationDate: { gte: now } },
      include: { vehicle: { select: { id: true, brand: true, model: true } } },
      orderBy: { expirationDate: 'asc' },
      take: 5,
    });

    const unreadAlerts = await prisma.alert.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const alertCount = await prisma.alert.count({
      where: { userId, isRead: false },
    });

    const recentExpenses = await prisma.expense.findMany({
      where: { vehicle: { userId } },
      include: { vehicle: { select: { brand: true, model: true } } },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const expensesByCategory = await prisma.$queryRaw`
      SELECT 
        e.category,
        SUM(e.amount) as total
      FROM expenses e
      JOIN vehicles v ON e."vehicleId" = v.id
      WHERE v."userId" = ${userId}
        AND e.date >= ${yearStart}
      GROUP BY e.category
      ORDER BY total DESC
    `;

    const monthNames = [
      'J', 'F', 'M', 'A', 'M', 'J',
      'J', 'A', 'S', 'O', 'N', 'D',
    ];

    const formattedMonthly = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyExpenses.find(m => Number(m.month) === i + 1);
      return { month: monthNames[i], total: found ? Number(found.total) : 0 };
    });

    let avgHealthScore = null;
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { userId },
        select: { id: true },
      });
      if (vehicles.length > 0) {
        const scores = await Promise.all(
          vehicles.map(v => healthService.getHealthScore(v.id, userId))
        );
        const validScores = scores.filter(Boolean);
        if (validScores.length > 0) {
          avgHealthScore = Math.round(
            validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length
          );
        }
      }
    } catch (err) {
      console.error('Erreur calcul score moyen:', err.message);
    }

    // --- Action cards ("À faire bientôt") ---
    const actionCards = await this._buildActionCards(userId, now);

    // --- Coût total de possession par véhicule ---
    const ownershipCosts = await this._calcOwnershipCosts(userId);

    return {
      vehicleCount,
      totalExpensesYear: yearExpenses._sum.amount || 0,
      avgHealthScore,
      monthlyExpenses: formattedMonthly,
      ownershipCosts,
      upcomingDeadlines: upcomingDeadlines.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        expirationDate: d.expirationDate,
        vehicle: { id: d.vehicle.id, brand: d.vehicle.brand, model: d.vehicle.model },
      })),
      unreadAlerts,
      alertCount,
      recentExpenses,
      expensesByCategory: expensesByCategory.map(c => ({
        category: c.category,
        total: Number(c.total),
      })),
      actionCards,
    };
  }

  async _buildActionCards(userId, now) {
    const cards = [];
    const in90Days = new Date(now);
    in90Days.setDate(in90Days.getDate() + 90);

    // 1. Next technical inspection
    const nextCT = await prisma.document.findFirst({
      where: {
        vehicle: { userId },
        type: 'TECHNICAL_INSPECTION',
        expirationDate: { gte: now, lte: in90Days },
      },
      include: { vehicle: { select: { id: true, brand: true, model: true } } },
      orderBy: { expirationDate: 'asc' },
    });
    if (nextCT) {
      const days = Math.ceil((nextCT.expirationDate - now) / 864e5);
      cards.push({
        id: 'next-ct',
        type: 'INSPECTION',
        title: 'Prochain contrôle technique',
        subtitle: `${nextCT.vehicle.brand} ${nextCT.vehicle.model}`,
        daysLeft: days,
        dueDate: nextCT.expirationDate,
        vehicleId: nextCT.vehicle.id,
        urgency: days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'info',
        cta: 'Voir le véhicule',
      });
    }

    // 2. Next insurance expiry
    const nextInsurance = await prisma.document.findFirst({
      where: {
        vehicle: { userId },
        type: 'INSURANCE',
        expirationDate: { gte: now, lte: in90Days },
      },
      include: { vehicle: { select: { id: true, brand: true, model: true } } },
      orderBy: { expirationDate: 'asc' },
    });
    if (nextInsurance) {
      const days = Math.ceil((nextInsurance.expirationDate - now) / 864e5);
      cards.push({
        id: 'insurance-expiry',
        type: 'INSURANCE',
        title: 'Assurance expire bientôt',
        subtitle: `${nextInsurance.vehicle.brand} ${nextInsurance.vehicle.model}`,
        daysLeft: days,
        dueDate: nextInsurance.expirationDate,
        vehicleId: nextInsurance.vehicle.id,
        urgency: days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'info',
        cta: 'Voir le véhicule',
      });
    }

    // 3. Maintenance due (no maintenance in last 6 months)
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const vehiclesNeedingMaint = await prisma.vehicle.findMany({
      where: { userId },
      include: {
        expenses: {
          where: { category: 'MAINTENANCE', date: { gte: sixMonthsAgo } },
          take: 1,
        },
      },
    });
    const needsMaint = vehiclesNeedingMaint.find(v => v.expenses.length === 0);
    if (needsMaint) {
      cards.push({
        id: 'maintenance-due',
        type: 'MAINTENANCE',
        title: 'Entretien à prévoir',
        subtitle: `${needsMaint.brand} ${needsMaint.model}`,
        daysLeft: null,
        dueDate: null,
        vehicleId: needsMaint.id,
        urgency: 'warning',
        cta: 'Planifier',
      });
    }

    // 4. Expired documents (already past due)
    const expiredDoc = await prisma.document.findFirst({
      where: {
        vehicle: { userId },
        expirationDate: { lt: now },
      },
      include: { vehicle: { select: { id: true, brand: true, model: true } } },
      orderBy: { expirationDate: 'desc' },
    });
    if (expiredDoc) {
      const daysPast = Math.ceil((now - expiredDoc.expirationDate) / 864e5);
      cards.push({
        id: 'expired-doc',
        type: 'EXPIRED',
        title: `Document expiré`,
        subtitle: `${expiredDoc.name} — ${expiredDoc.vehicle.brand} ${expiredDoc.vehicle.model}`,
        daysLeft: -daysPast,
        dueDate: expiredDoc.expirationDate,
        vehicleId: expiredDoc.vehicle.id,
        urgency: 'critical',
        cta: 'Renouveler',
      });
    }

    // Sort by urgency: critical first, then warning, then info — max 3
    const urgencyOrder = { critical: 0, warning: 1, info: 2 };
    cards.sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9));

    return cards.slice(0, 3);
  }

  async _calcOwnershipCosts(userId) {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      select: { id: true, brand: true, model: true, fuelType: true, createdAt: true, purchasePrice: true },
    });

    if (vehicles.length === 0) return [];

    const results = [];
    for (const v of vehicles) {
      const monthsOwned = Math.max(1, Math.round((Date.now() - new Date(v.createdAt).getTime()) / (30.44 * 24 * 60 * 60 * 1000)));

      const totalExpenses = await prisma.expense.aggregate({
        where: { vehicleId: v.id },
        _sum: { amount: true },
      });

      const totalFuel = await prisma.fuelEntry.aggregate({
        where: { vehicleId: v.id },
        _sum: { totalCost: true },
      });

      const expenseTotal = Number(totalExpenses._sum.amount || 0);
      const fuelTotal = Number(totalFuel._sum.totalCost || 0);
      const grandTotal = expenseTotal + fuelTotal;
      const monthly = Math.round((grandTotal / monthsOwned) * 100) / 100;
      const daily = Math.round((grandTotal / (monthsOwned * 30.44)) * 100) / 100;

      results.push({
        vehicleId: v.id,
        brand: v.brand,
        model: v.model,
        fuelType: v.fuelType,
        monthsOwned,
        totalExpenses: expenseTotal,
        totalFuel: fuelTotal,
        grandTotal,
        monthlyAvg: monthly,
        dailyAvg: daily,
      });
    }

    return results;
  }
}

module.exports = new DashboardService();
