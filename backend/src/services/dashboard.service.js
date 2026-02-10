const prisma = require('../lib/prisma');
const healthService = require('./health.service');

class DashboardService {
  /**
   * Récupérer les données du dashboard
   */
  async getData(userId) {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Nombre de véhicules
    const vehicleCount = await prisma.vehicle.count({
      where: { userId },
    });

    // Total dépenses année en cours
    const yearExpenses = await prisma.expense.aggregate({
      where: {
        vehicle: { userId },
        date: { gte: yearStart },
      },
      _sum: { amount: true },
    });

    // Dépenses mensuelles
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

    // Prochaines échéances (documents qui expirent bientôt)
    const upcomingDeadlines = await prisma.document.findMany({
      where: {
        vehicle: { userId },
        expirationDate: { gte: new Date() },
      },
      include: {
        vehicle: { select: { brand: true, model: true } },
      },
      orderBy: { expirationDate: 'asc' },
      take: 5,
    });

    // Alertes non lues
    const unreadAlerts = await prisma.alert.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const alertCount = await prisma.alert.count({
      where: { userId, isRead: false },
    });

    // Dernières dépenses
    const recentExpenses = await prisma.expense.findMany({
      where: { vehicle: { userId } },
      include: {
        vehicle: { select: { brand: true, model: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    // Dépenses par catégorie
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

    // Formater les mois
    const monthNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];

    const formattedMonthly = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyExpenses.find(m => Number(m.month) === i + 1);
      return {
        month: monthNames[i],
        total: found ? Number(found.total) : 0,
      };
    });

    // Score santé moyen
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

    return {
      vehicleCount,
      totalExpensesYear: yearExpenses._sum.amount || 0,
      avgHealthScore,
      monthlyExpenses: formattedMonthly,
      upcomingDeadlines: upcomingDeadlines.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        expirationDate: d.expirationDate,
        vehicle: `${d.vehicle.brand} ${d.vehicle.model}`,
      })),
      unreadAlerts,
      alertCount,
      recentExpenses,
      expensesByCategory: expensesByCategory.map(c => ({
        category: c.category,
        total: Number(c.total),
      })),
    };
  }
}

module.exports = new DashboardService();
