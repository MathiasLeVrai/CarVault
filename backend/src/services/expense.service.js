const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

class ExpenseService {
  /**
   * Récupérer les dépenses d'un véhicule
   */
  async getByVehicle(vehicleId, userId, filters = {}) {
    await this.verifyOwnership(vehicleId, userId);

    const where = { vehicleId };
    if (filters.category) {
      where.category = filters.category;
    }

    return prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Récupérer toutes les dépenses de l'utilisateur
   */
  async getAllByUser(userId, filters = {}) {
    const where = {
      vehicle: { userId },
    };
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.year) {
      const yearStart = new Date(parseInt(filters.year), 0, 1);
      const yearEnd = new Date(parseInt(filters.year) + 1, 0, 1);
      where.date = { gte: yearStart, lt: yearEnd };
    }

    return prisma.expense.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Créer une dépense
   */
  async create(data, vehicleId, userId) {
    await this.verifyOwnership(vehicleId, userId);

    return prisma.expense.create({
      data: {
        ...data,
        date: new Date(data.date),
        vehicleId,
      },
    });
  }

  /**
   * Supprimer une dépense
   */
  async delete(id, userId) {
    const expense = await prisma.expense.findFirst({
      where: { id },
      include: { vehicle: true },
    });

    if (!expense || expense.vehicle.userId !== userId) {
      throw new AppError('Dépense non trouvée', 404);
    }

    return prisma.expense.delete({ where: { id } });
  }

  /**
   * Statistiques de dépenses
   */
  async getStats(userId) {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const totalYear = await prisma.expense.aggregate({
      where: {
        vehicle: { userId },
        date: { gte: yearStart },
      },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    });

    const monthlyData = await prisma.$queryRaw`
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

    const byCategory = await prisma.$queryRaw`
      SELECT 
        e.category,
        SUM(e.amount) as total,
        COUNT(*) as count
      FROM expenses e
      JOIN vehicles v ON e."vehicleId" = v.id
      WHERE v."userId" = ${userId}
        AND e.date >= ${yearStart}
      GROUP BY e.category
      ORDER BY total DESC
    `;

    return {
      totalYear: totalYear._sum.amount || 0,
      averageExpense: totalYear._avg.amount || 0,
      expenseCount: totalYear._count,
      monthlyData: monthlyData.map(m => ({
        month: Number(m.month),
        total: Number(m.total),
      })),
      byCategory: byCategory.map(c => ({
        category: c.category,
        total: Number(c.total),
        count: Number(c.count),
      })),
    };
  }

  async verifyOwnership(vehicleId, userId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });
    if (!vehicle) {
      throw new AppError('Véhicule non trouvé', 404);
    }
    return vehicle;
  }
}

module.exports = new ExpenseService();
