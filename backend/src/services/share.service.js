const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

class ShareService {
  async createLink(vehicleId, userId, expiresInDays = 30) {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!vehicle) throw new AppError('Véhicule non trouvé', 404);

    const existing = await prisma.shareLink.findFirst({
      where: { vehicleId, userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    });
    if (existing) return existing;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return prisma.shareLink.create({
      data: { vehicleId, userId, expiresAt },
    });
  }

  async getByToken(token) {
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        vehicle: {
          include: {
            documents: { orderBy: { createdAt: 'desc' } },
            expenses: { orderBy: { date: 'desc' } },
            mileageEntries: { orderBy: { date: 'desc' }, take: 10 },
          },
        },
      },
    });

    if (!link) throw new AppError('Lien introuvable', 404);
    if (link.expiresAt && link.expiresAt < new Date()) throw new AppError('Ce lien a expiré', 410);

    return link;
  }

  async revokeLink(id, userId) {
    const link = await prisma.shareLink.findFirst({ where: { id, userId } });
    if (!link) throw new AppError('Lien introuvable', 404);
    return prisma.shareLink.delete({ where: { id } });
  }

  async getLinksForVehicle(vehicleId, userId) {
    return prisma.shareLink.findMany({
      where: { vehicleId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new ShareService();
