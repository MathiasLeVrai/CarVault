const cron = require('node-cron');
const prisma = require('../lib/prisma');
const emailService = require('../services/email.service');
const pushService = require('../services/push.service');

/**
 * Digest hebdomadaire — envoyé chaque lundi à 8h
 * Résume : échéances de la semaine, alertes actives, dépenses récentes
 */

async function generateWeeklyDigest() {
  console.log('[CRON] Génération des digests hebdomadaires...');

  const now = new Date();
  const inOneWeek = new Date(now);
  inOneWeek.setDate(inOneWeek.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const users = await prisma.user.findMany({
    where: {
      notifWeekly: true,
      vehicles: { some: {} },
    },
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
      // Documents expirant dans les 7 prochains jours
      const upcomingDocs = await prisma.document.findMany({
        where: {
          vehicle: { userId: user.id },
          expirationDate: { gte: now, lte: inOneWeek },
        },
        include: { vehicle: { select: { brand: true, model: true } } },
        orderBy: { expirationDate: 'asc' },
      });

      // Documents déjà expirés (non traités)
      const expiredDocs = await prisma.document.findMany({
        where: {
          vehicle: { userId: user.id },
          expirationDate: { lt: now, gte: lastWeek },
        },
        include: { vehicle: { select: { brand: true, model: true } } },
        orderBy: { expirationDate: 'asc' },
        take: 5,
      });

      // Alertes actives non lues
      const activeAlerts = await prisma.alert.count({
        where: { userId: user.id, isRead: false },
      });

      // Dépenses de la semaine passée
      const weekExpenses = await prisma.expense.aggregate({
        where: {
          vehicle: { userId: user.id },
          date: { gte: lastWeek, lte: now },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Carburant de la semaine
      const weekFuel = await prisma.fuelEntry.aggregate({
        where: {
          vehicle: { userId: user.id },
          date: { gte: lastWeek, lte: now },
        },
        _sum: { totalCost: true, liters: true },
      });

      const expenseTotal = Number(weekExpenses._sum.amount || 0);
      const fuelTotal = Number(weekFuel._sum.totalCost || 0);

      // Pas de digest si rien à signaler
      if (upcomingDocs.length === 0 && expiredDocs.length === 0 && activeAlerts === 0 && expenseTotal === 0 && fuelTotal === 0) {
        continue;
      }

      const title = 'Votre récap de la semaine';
      const lines = [];

      if (expiredDocs.length > 0) {
        lines.push(`${expiredDocs.length} document(s) expiré(s) cette semaine`);
      }
      if (upcomingDocs.length > 0) {
        lines.push(`${upcomingDocs.length} échéance(s) dans les 7 prochains jours`);
      }
      if (activeAlerts > 0) {
        lines.push(`${activeAlerts} alerte(s) active(s)`);
      }

      // Push notification
      if (user.notifPush !== false) {
        try {
          await pushService.sendToUser(user.id, title, lines[0] || 'Consultez votre récap hebdomadaire', '/dashboard');
        } catch { /* best effort */ }
      }

      // Email
      if (emailService.isConfigured() && user.email && user.notifEmail !== false) {
        await sendWeeklyEmail(user.email, user.firstName, {
          upcomingDocs,
          expiredDocs,
          activeAlerts,
          expenseTotal,
          fuelTotal,
          fuelLiters: Number(weekFuel._sum.liters || 0),
          expenseCount: weekExpenses._count,
        });
        sent++;
      }
    } catch (err) {
      console.error(`[CRON] Digest hebdo erreur pour user ${user.id}:`, err.message);
    }
  }

  console.log(`[CRON] ${sent} digest(s) hebdomadaire(s) envoyé(s).`);
}

async function sendWeeklyEmail(email, firstName, data) {
  const appUrl = process.env.APP_URL || 'https://carvault.fly.dev';
  const sections = [];

  // Documents expirés
  if (data.expiredDocs.length > 0) {
    const items = data.expiredDocs.map(d => {
      const daysAgo = Math.ceil((new Date() - d.expirationDate) / 864e5);
      return `<tr><td style="padding:6px 0;font-size:13px;color:#e63946;">
        <strong>${d.name}</strong> (${d.vehicle.brand} ${d.vehicle.model}) — expiré depuis ${daysAgo}j
      </td></tr>`;
    }).join('');
    sections.push(`
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#e63946;">Documents expirés</h3>
        <table width="100%" cellpadding="0" cellspacing="0"><tbody>${items}</tbody></table>
      </div>
    `);
  }

  // Échéances à venir
  if (data.upcomingDocs.length > 0) {
    const items = data.upcomingDocs.map(d => {
      const daysLeft = Math.ceil((d.expirationDate - new Date()) / 864e5);
      const color = daysLeft <= 3 ? '#f97316' : '#f59e0b';
      return `<tr><td style="padding:6px 0;font-size:13px;color:${color};">
        <strong>${d.name}</strong> (${d.vehicle.brand} ${d.vehicle.model}) — dans ${daysLeft}j
      </td></tr>`;
    }).join('');
    sections.push(`
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#f59e0b;">Échéances cette semaine</h3>
        <table width="100%" cellpadding="0" cellspacing="0"><tbody>${items}</tbody></table>
      </div>
    `);
  }

  // Alertes actives
  if (data.activeAlerts > 0) {
    sections.push(`
      <div style="margin-bottom:20px;padding:12px 16px;background:#fef2f2;border-radius:10px;">
        <span style="font-size:14px;font-weight:700;color:#e63946;">${data.activeAlerts} alerte(s) non lue(s)</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">→ Consultez vos alertes</span>
      </div>
    `);
  }

  // Résumé dépenses
  const total = data.expenseTotal + data.fuelTotal;
  if (total > 0) {
    const rows = [];
    if (data.fuelTotal > 0) {
      rows.push(`<tr><td style="padding:4px 0;font-size:13px;color:#666;">Carburant (${data.fuelLiters.toFixed(1)}L)</td><td style="text-align:right;font-weight:600;color:#1a1a1a;">${data.fuelTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td></tr>`);
    }
    if (data.expenseTotal > 0) {
      rows.push(`<tr><td style="padding:4px 0;font-size:13px;color:#666;">Entretien & autres (${data.expenseCount})</td><td style="text-align:right;font-weight:600;color:#1a1a1a;">${data.expenseTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td></tr>`);
    }
    sections.push(`
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1a1a1a;">Dépenses de la semaine</h3>
        <table width="100%" cellpadding="0" cellspacing="0"><tbody>${rows.join('')}</tbody></table>
      </div>
    `);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:#1a1a1a;padding:24px 32px;">
    <span style="color:#ff2a3f;font-size:20px;font-weight:800;letter-spacing:-0.5px;">CAR<span style="color:#fff;">VAULT</span></span>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 8px;font-size:13px;color:#888888;">Bonjour ${firstName || ''},</p>
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:800;color:#1a1a1a;">Votre récap de la semaine</h2>
    ${sections.join('')}
    <div style="margin-top:28px;">
      <a href="${appUrl}/dashboard" style="display:block;text-align:center;padding:14px 24px;background:#ff2a3f;color:#fff;border-radius:12px;font-weight:700;text-decoration:none;font-size:14px;">Voir mon dashboard →</a>
    </div>
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f9f9fb;border-top:1px solid #eeeeee;">
    <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;">CarVault · Récap hebdomadaire · <a href="${appUrl}/settings" style="color:#aaaaaa;text-decoration:none;">Se désabonner</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  try {
    const transporter = emailService._getTransporter();
    if (!transporter) return;
    await transporter.sendMail({
      from: `"CarVault" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `📬 CarVault — Votre récap de la semaine`,
      html,
    });
  } catch (err) {
    console.error('[EMAIL] Erreur digest hebdo:', err.message);
  }
}

function startWeeklyDigestCron() {
  // Chaque lundi à 8h
  cron.schedule('0 8 * * 1', () => generateWeeklyDigest());
  console.log('[CRON] Digest hebdomadaire activé (lundi 8h).');
}

module.exports = { startWeeklyDigestCron };
