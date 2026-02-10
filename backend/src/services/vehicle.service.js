const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

class VehicleService {
  /**
   * Récupérer tous les véhicules d'un utilisateur
   */
  async getAll(userId) {
    return prisma.vehicle.findMany({
      where: { userId },
      include: {
        _count: {
          select: { documents: true, expenses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer un véhicule par ID
   */
  async getById(id, userId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        expenses: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { documents: true, expenses: true },
        },
      },
    });

    if (!vehicle) {
      throw new AppError('Véhicule non trouvé', 404);
    }

    // Calculer les stats du véhicule
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const yearExpenses = await prisma.expense.aggregate({
      where: {
        vehicleId: id,
        date: { gte: yearStart },
      },
      _sum: { amount: true },
    });

    const monthlyExpenses = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        SUM(amount) as total
      FROM expenses
      WHERE "vehicleId" = ${id}
        AND date >= ${yearStart}
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month
    `;

    return {
      ...vehicle,
      stats: {
        totalExpensesYear: yearExpenses._sum.amount || 0,
        monthlyExpenses: monthlyExpenses.map(m => ({
          month: Number(m.month),
          total: Number(m.total),
        })),
      },
    };
  }

  /**
   * Créer un véhicule
   */
  async create(data, userId) {
    return prisma.vehicle.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  /**
   * Mettre à jour un véhicule
   */
  async update(id, data, userId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId },
    });

    if (!vehicle) {
      throw new AppError('Véhicule non trouvé', 404);
    }

    return prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  /**
   * Récupérer toutes les données d'un véhicule (pour PDF)
   * Sans limite de documents/dépenses
   */
  async getFullData(id, userId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
        _count: { select: { documents: true, expenses: true } },
      },
    });

    if (!vehicle) {
      throw new AppError('Véhicule non trouvé', 404);
    }

    // Stats
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const yearExpenses = await prisma.expense.aggregate({
      where: { vehicleId: id, date: { gte: yearStart } },
      _sum: { amount: true },
    });

    const totalExpenses = await prisma.expense.aggregate({
      where: { vehicleId: id },
      _sum: { amount: true },
    });

    return {
      vehicle,
      documents: vehicle.documents,
      expenses: vehicle.expenses,
      stats: {
        totalExpensesYear: yearExpenses._sum.amount || 0,
        totalExpensesAll: totalExpenses._sum.amount || 0,
      },
    };
  }

  /**
   * Supprimer un véhicule
   */
  async delete(id, userId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId },
    });

    if (!vehicle) {
      throw new AppError('Véhicule non trouvé', 404);
    }

    return prisma.vehicle.delete({ where: { id } });
  }
}

module.exports = new VehicleService();
