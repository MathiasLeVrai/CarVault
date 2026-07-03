const prisma = require('../lib/prisma');

class NotificationService {
  async getPreferences(userId) {
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { notifEmail: true, notifPush: true, notifWeekly: true },
    });
    return user;
  }

  async updatePreferences(userId, prefs) {
    const data = {};
    if (typeof prefs.notifEmail === 'boolean') data.notifEmail = prefs.notifEmail;
    if (typeof prefs.notifPush === 'boolean') data.notifPush = prefs.notifPush;
    if (typeof prefs.notifWeekly === 'boolean') data.notifWeekly = prefs.notifWeekly;

    return prisma.utilisateur.update({
      where: { id: userId },
      data,
      select: { notifEmail: true, notifPush: true, notifWeekly: true },
    });
  }
}

module.exports = new NotificationService();
