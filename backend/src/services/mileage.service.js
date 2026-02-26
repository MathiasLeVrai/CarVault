const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

class MileageService {
  async verifyOwnership(vehicleId, userId) {
    const v = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!v) throw new AppError('Véhicule non trouvé', 404);
    return v;
  }

  async getAll(vehicleId, userId) {
    await this.verifyOwnership(vehicleId, userId);
    return prisma.mileageEntry.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async create(vehicleId, userId, { mileage, date, notes }) {
    const vehicle = await this.verifyOwnership(vehicleId, userId);

    const entry = await prisma.mileageEntry.create({
      data: {
        vehicleId,
        mileage: parseInt(mileage),
        date: new Date(date),
        notes: notes || null,
      },
    });

    // Mettre à jour le kilométrage courant du véhicule si supérieur
    if (parseInt(mileage) > vehicle.mileage) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { mileage: parseInt(mileage) },
      });
    }

    return entry;
  }

  async delete(id, userId) {
    const entry = await prisma.mileageEntry.findFirst({
      where: { id },
      include: { vehicle: { select: { userId: true } } },
    });
    if (!entry || entry.vehicle.userId !== userId) throw new AppError('Entrée non trouvée', 404);
    return prisma.mileageEntry.delete({ where: { id } });
  }
}

module.exports = new MileageService();
