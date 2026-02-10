const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

class AlertService {
  /**
   * Récupérer les alertes d'un utilisateur
   */
  async getAll(userId, onlyUnread = false) {
    const where = { userId };
    if (onlyUnread) {
      where.isRead = false;
    }

    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Compter les alertes non lues
   */
  async countUnread(userId) {
    return prisma.alert.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marquer une alerte comme lue
   */
  async markAsRead(id, userId) {
    const alert = await prisma.alert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      throw new AppError('Alerte non trouvée', 404);
    }

    return prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Marquer toutes les alertes comme lues
   */
  async markAllAsRead(userId) {
    return prisma.alert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Vérifier les documents expirés et créer des alertes
   * Cette méthode serait appelée par un cron job en production
   */
  async checkExpiringDocuments(userId) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocs = await prisma.document.findMany({
      where: {
        vehicle: { userId },
        expirationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      include: {
        vehicle: { select: { brand: true, model: true } },
      },
    });

    const alerts = [];
    for (const doc of expiringDocs) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          userId,
          type: 'DOCUMENT_EXPIRY',
          title: { contains: doc.name },
          dueDate: doc.expirationDate,
        },
      });

      if (!existingAlert) {
        const alert = await prisma.alert.create({
          data: {
            title: `Expiration prochaine: ${doc.name}`,
            message: `Le document "${doc.name}" de votre ${doc.vehicle.brand} ${doc.vehicle.model} expire le ${doc.expirationDate.toLocaleDateString('fr-FR')}`,
            type: 'DOCUMENT_EXPIRY',
            dueDate: doc.expirationDate,
            userId,
          },
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Supprimer une alerte
   */
  async delete(id, userId) {
    const alert = await prisma.alert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      throw new AppError('Alerte non trouvée', 404);
    }

    return prisma.alert.delete({ where: { id } });
  }
}

module.exports = new AlertService();
