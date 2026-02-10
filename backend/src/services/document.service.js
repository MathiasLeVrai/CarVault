const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

class DocumentService {
  /**
   * Récupérer tous les documents d'un véhicule
   */
  async getByVehicle(vehicleId, userId, filters = {}) {
    // Vérifier que le véhicule appartient à l'utilisateur
    await this.verifyOwnership(vehicleId, userId);

    const where = { vehicleId };
    if (filters.type) {
      where.type = filters.type;
    }

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer tous les documents de l'utilisateur
   */
  async getAllByUser(userId, filters = {}) {
    const where = {
      vehicle: { userId },
    };
    if (filters.type) {
      where.type = filters.type;
    }

    return prisma.document.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Créer un document
   */
  async create(data, vehicleId, userId) {
    await this.verifyOwnership(vehicleId, userId);

    const document = await prisma.document.create({
      data: {
        ...data,
        vehicleId,
      },
    });

    // Créer une alerte si le document a une date d'expiration
    if (data.expirationDate) {
      await prisma.alert.create({
        data: {
          title: `Expiration: ${data.name}`,
          message: `Le document "${data.name}" expire le ${new Date(data.expirationDate).toLocaleDateString('fr-FR')}`,
          type: 'DOCUMENT_EXPIRY',
          dueDate: new Date(data.expirationDate),
          userId,
        },
      });
    }

    return document;
  }

  /**
   * Supprimer un document
   */
  async delete(id, userId) {
    const document = await prisma.document.findFirst({
      where: { id },
      include: { vehicle: true },
    });

    if (!document || document.vehicle.userId !== userId) {
      throw new AppError('Document non trouvé', 404);
    }

    return prisma.document.delete({ where: { id } });
  }

  /**
   * Vérifier que le véhicule appartient à l'utilisateur
   */
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

module.exports = new DocumentService();
