const cron = require('node-cron');
const prisma = require('../lib/prisma');
const emailService = require('../services/email.service');
const pushService = require('../services/push.service');

/**
 * Rapport mensuel envoyé le 1er de chaque mois à 9h
 * Résume : dépenses du mois, alertes à venir, km parcourus
 */

async function generateMonthlyReport() {
  console.log('[CRON] Génération des rapports mensuels...');

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const monthName = lastMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  const users = await prisma.utilisateur.findMany({
    where: { vehicles: { some: {} } },
    select: {
      id: true,
      email: true,
      firstName: true,
      notifEmail: true,
      notifPush: true,
    },
  });

  let sent = 0;

  for (const user of users) {
    try {
      // Dépenses du mois dernier
      const monthExpenses = await prisma.depense.aggregate({
        where: {
          vehicle: { userId: user.id },
          date: { gte: lastMonth, lte: lastMonthEnd },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Carburant du mois
      const monthFuel = await prisma.entreeCarburant.aggregate({
        where: {
          vehicle: { userId: user.id },
          date: { gte: lastMonth, lte: lastMonthEnd },
        },
        _sum: { totalCost: true, liters: true },
      });

      // Alertes actives
      const activeAlerts = await prisma.alerte.count({
        where: { userId: user.id, isRead: false },
      });

      // Prochaine échéance document
      const nextDoc = await prisma.document.findFirst({
        where: { vehicle: { userId: user.id }, expirationDate: { gte: now } },
        include: { vehicle: { select: { brand: true, model: true } } },
        orderBy: { expirationDate: 'asc' },
      });

      const expenseTotal = Number(monthExpenses._sum.amount || 0);
      const fuelTotal = Number(monthFuel._sum.totalCost || 0);
      const fuelLiters = Number(monthFuel._sum.liters || 0);
      const total = expenseTotal + fuelTotal;

      // Pas de rapport si aucune activité
      if (total === 0 && activeAlerts === 0 && !nextDoc) continue;

      const title = `Rapport ${monthName}`;
      const lines = [];
      if (total > 0) lines.push(`Total dépenses : ${total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
      if (fuelLiters > 0) lines.push(`Carburant : ${fuelLiters.toFixed(1)}L (${fuelTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`);
      if (expenseTotal > 0) lines.push(`Entretien/autres : ${expenseTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} (${monthExpenses._count} opérations)`);
      if (activeAlerts > 0) lines.push(`${activeAlerts} alerte(s) active(s)`);
      if (nextDoc) {
        const daysLeft = Math.ceil((nextDoc.expirationDate - now) / 864e5);
        lines.push(`Prochaine échéance : ${nextDoc.name} (${nextDoc.vehicle.brand} ${nextDoc.vehicle.model}) dans ${daysLeft}j`);
      }

      // Push notification
      if (user.notifPush !== false) {
        try {
          await pushService.sendToUser(user.id, title, lines[0] || 'Consultez votre récap mensuel');
        } catch { /* best effort */ }
      }

      // Email
      if (emailService.isConfigured() && user.email && user.notifEmail !== false) {
        await sendMonthlyEmail(user.email, user.firstName, monthName, {
          total, expenseTotal, fuelTotal, fuelLiters,
          expenseCount: monthExpenses._count,
          activeAlerts, nextDoc,
        });
        sent++;
      }
    } catch (err) {
      console.error(`[CRON] Rapport mensuel erreur pour user ${user.id}:`, err.message);
    }
  }

  console.log(`[CRON] ${sent} rapport(s) mensuel(s) envoyé(s).`);
}

async function sendMonthlyEmail(email, firstName, monthName, data) {
  const appUrl = process.env.APP_URL || 'https://carvio.fr';
  const rows = [];

  if (data.total > 0) {
    rows.push(`<tr><td style="padding:8px 0;color:#666;">Total dépenses</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#1a1a1a;">${data.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td></tr>`);
  }
  if (data.fuelTotal > 0) {
    rows.push(`<tr><td style="padding:8px 0;color:#666;">Carburant (${data.fuelLiters.toFixed(1)}L)</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#1a1a1a;">${data.fuelTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td></tr>`);
  }
  if (data.expenseTotal > 0) {
    rows.push(`<tr><td style="padding:8px 0;color:#666;">Entretien & autres (${data.expenseCount})</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#1a1a1a;">${data.expenseTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td></tr>`);
  }
  if (data.activeAlerts > 0) {
    rows.push(`<tr><td style="padding:8px 0;color:#666;">Alertes actives</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#e63946;">${data.activeAlerts}</td></tr>`);
  }
  if (data.nextDoc) {
    const daysLeft = Math.ceil((data.nextDoc.expirationDate - new Date()) / 864e5);
    rows.push(`<tr><td style="padding:8px 0;color:#666;">Prochaine échéance</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#f59e0b;">${data.nextDoc.name} dans ${daysLeft}j</td></tr>`);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:#1a1a1a;padding:24px 32px;">
    <span style="color:#ff2a3f;font-size:20px;font-weight:800;letter-spacing:-0.5px;">CAR<span style="color:#fff;">VIO</span></span>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 8px;font-size:13px;color:#888888;">Bonjour ${firstName || ''},</p>
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:800;color:#1a1a1a;">Votre récap de ${monthName}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tbody style="font-size:14px;">
        ${rows.join('')}
      </tbody>
    </table>
    <div style="margin-top:28px;">
      <a href="${appUrl}/dashboard" style="display:block;text-align:center;padding:14px 24px;background:#ff2a3f;color:#fff;border-radius:12px;font-weight:700;text-decoration:none;font-size:14px;">Voir mon dashboard →</a>
    </div>
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f9f9fb;border-top:1px solid #eeeeee;">
    <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;">Carvio · Rapport mensuel automatique</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  try {
    const transporter = emailService._getTransporter();
    if (!transporter) return;
    await transporter.sendMail({
      from: emailService.smtpFromHeader(),
      to: email,
      subject: `📊 Carvio — Votre récap de ${monthName}`,
      html,
    });
  } catch (err) {
    console.error('[EMAIL] Erreur rapport mensuel:', err.message);
  }
}

function startMonthlyReportCron() {
  // Le 1er de chaque mois à 9h
  cron.schedule('0 9 1 * *', () => generateMonthlyReport());
  console.log('[CRON] Rapport mensuel activé (1er du mois à 9h).');
}

module.exports = { startMonthlyReportCron };
