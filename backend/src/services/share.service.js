const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

class ShareService {
  async createLink(vehicleId, userId, opts = {}) {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!vehicle) throw new AppError('Véhicule non trouvé', 404);

    const { expiresInDays = 30, password, hidePurchasePrice = false, label } = opts;

    let expiresAt = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    return prisma.shareLink.create({
      data: {
        vehicleId,
        userId,
        expiresAt,
        passwordHash,
        hidePurchasePrice: !!hidePurchasePrice,
        label: label || null,
      },
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

  async verifyAccess(link, password) {
    if (!link.passwordHash) return true;
    if (!password) throw new AppError('Mot de passe requis', 401, 'PASSWORD_REQUIRED');
    const ok = await bcrypt.compare(String(password), link.passwordHash);
    if (!ok) throw new AppError('Mot de passe invalide', 401, 'PASSWORD_INVALID');
    return true;
  }

  async trackView(linkId) {
    return prisma.shareLink.update({
      where: { id: linkId },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    });
  }

  async revokeLink(id, userId) {
    const link = await prisma.shareLink.findFirst({ where: { id, userId } });
    if (!link) throw new AppError('Lien introuvable', 404);
    return prisma.shareLink.delete({ where: { id } });
  }

  async getLinksForVehicle(vehicleId, userId) {
    const links = await prisma.shareLink.findMany({
      where: { vehicleId, userId },
      orderBy: { createdAt: 'desc' },
    });
    return links.map(({ passwordHash, ...rest }) => ({
      ...rest,
      hasPassword: !!passwordHash,
    }));
  }
}

module.exports = new ShareService();
