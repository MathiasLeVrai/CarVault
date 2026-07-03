const prisma = require('../lib/prisma');
const emailService = require('../services/email.service');
const pushService = require('../services/push.service');

/**
 * Helpers partagés entre les crons d'alertes.
 */

async function alertExists(userId, type, titleContains, options = {}) {
  const where = { userId, type, title: { contains: titleContains } };
  if (options.since) where.createdAt = { gte: options.since };
  if (options.dueDate) where.dueDate = options.dueDate;
  return prisma.alerte.findFirst({ where });
}

async function createAlert(data, { email, userName, dueDate } = {}) {
  const alert = await prisma.alerte.create({ data });

  // Send push notification (best-effort)
  try {
    await pushService.sendToUser(data.userId, data.title, data.message);
  } catch { /* push is best-effort */ }

  // Send email notification
  if (email && emailService.isConfigured()) {
    const sent = await emailService.sendAlertEmail(email, userName, data.title, data.message, dueDate || data.dueDate);
    if (sent) await prisma.alerte.update({ where: { id: alert.id }, data: { emailSent: true } });
  }

  return alert;
}

module.exports = { alertExists, createAlert };
