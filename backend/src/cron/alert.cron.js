const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { getMaintenanceIntervals } = require('../data/vehicles');
const emailService = require('../services/email.service');

/**
 * Système d'alertes intelligentes CarVault
 * 
 * Types d'alertes générées automatiquement :
 * 1. DOCUMENT_EXPIRY    — Documents proches/passés de leur date d'expiration
 * 2. MAINTENANCE_DUE    — Révision générale basée sur le temps (6 mois)
 * 3. OIL_CHANGE         — Vidange basée sur le kilométrage + modèle/carburant
 * 4. TIRE_SEASON        — Changement pneus été/hiver selon la saison
 * 5. MILEAGE_SERVICE    — Révision basée sur un seuil de km (freins, distribution, etc.)
 */

// ============================================================
// Helpers anti-doublon
// ============================================================

async function alertExists(userId, type, titleContains, options = {}) {
  const where = { userId, type, title: { contains: titleContains } };
  if (options.since) where.createdAt = { gte: options.since };
  if (options.dueDate) where.dueDate = options.dueDate;
  return prisma.alert.findFirst({ where });
}

async function createAlert(data) {
  return prisma.alert.create({ data });
}

// ============================================================
// 1. Expiration documents
// ============================================================

async function checkDocumentExpiry() {
  const now = new Date();
  const in90Days = new Date();
  in90Days.setDate(in90Days.getDate() + 90);
  let created = 0;

  const expiringDocs = await prisma.document.findMany({
    where: { expirationDate: { gte: now, lte: in90Days } },
    include: {
      vehicle: {
        include: { user: { select: { email: true, firstName: true, notifEmail: true } } },
      },
    },
  });

  for (const doc of expiringDocs) {
    if (await alertExists(doc.vehicle.userId, 'DOCUMENT_EXPIRY', doc.name, { dueDate: doc.expirationDate })) continue;
    const daysLeft = Math.ceil((doc.expirationDate - now) / (1000 * 60 * 60 * 24));

    // Use per-document reminder days, fallback to [30, 7, 1]
    const thresholds = (doc.reminderDays?.length > 0 ? doc.reminderDays : [30, 7, 1]).sort((a, b) => b - a);
    const matchesThreshold = thresholds.some((p, i) => {
      const nextThreshold = thresholds[i + 1] || 0;
      return daysLeft <= p && daysLeft > nextThreshold;
    });
    if (!matchesThreshold) continue;

    const title = `Expiration dans ${daysLeft}j : ${doc.name}`;
    const message = `Le document "${doc.name}" de votre ${doc.vehicle.brand} ${doc.vehicle.model} expire le ${doc.expirationDate.toLocaleDateString('fr-FR')}.`;

    const alert = await createAlert({
      title,
      message,
      type: 'DOCUMENT_EXPIRY',
      dueDate: doc.expirationDate,
      userId: doc.vehicle.userId,
      emailSent: false,
    });
    created++;

    // Send email only if user has email notifications enabled
    const user = doc.vehicle.user;
    if (emailService.isConfigured() && user?.email && user?.notifEmail !== false) {
      const sent = await emailService.sendAlertEmail(
        user.email,
        user.firstName,
        title,
        message,
        doc.expirationDate,
      );
      if (sent) await prisma.alert.update({ where: { id: alert.id }, data: { emailSent: true } });
    }
  }

  // Documents déjà expirés
  const expiredDocs = await prisma.document.findMany({
    where: { expirationDate: { lt: now } },
    include: { vehicle: { select: { id: true, brand: true, model: true, userId: true } } },
  });

  for (const doc of expiredDocs) {
    if (await alertExists(doc.vehicle.userId, 'DOCUMENT_EXPIRY', `Expiré`, { dueDate: doc.expirationDate })) continue;
    await createAlert({
      title: `Expiré : ${doc.name}`,
      message: `Le document "${doc.name}" de votre ${doc.vehicle.brand} ${doc.vehicle.model} a expiré le ${doc.expirationDate.toLocaleDateString('fr-FR')}. Pensez à le renouveler.`,
      type: 'DOCUMENT_EXPIRY',
      dueDate: doc.expirationDate,
      userId: doc.vehicle.userId,
    });
    created++;
  }

  return created;
}

// ============================================================
// 2. Révision générale (basée sur le temps)
// ============================================================

async function checkMaintenanceDue() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  let created = 0;

  const vehicles = await prisma.vehicle.findMany({
    include: {
      expenses: {
        where: { category: 'MAINTENANCE' },
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  for (const v of vehicles) {
    const lastMaint = v.expenses[0];
    const needsAlert = !lastMaint || lastMaint.date < sixMonthsAgo;
    if (!needsAlert) continue;
    if (await alertExists(v.userId, 'MAINTENANCE_DUE', `${v.brand} ${v.model}`, { since: sixMonthsAgo })) continue;

    await createAlert({
      title: `Révision recommandée : ${v.brand} ${v.model}`,
      message: lastMaint
        ? `Dernière maintenance le ${lastMaint.date.toLocaleDateString('fr-FR')}. Il y a plus de 6 mois — pensez à planifier un entretien.`
        : `Aucune maintenance enregistrée pour votre ${v.brand} ${v.model}. Planifiez un entretien.`,
      type: 'MAINTENANCE_DUE',
      userId: v.userId,
    });
    created++;
  }

  return created;
}

// ============================================================
// 3. Vidange basée sur kilométrage + modèle/carburant
// ============================================================

async function checkOilChange() {
  let created = 0;

  const vehicles = await prisma.vehicle.findMany({
    include: {
      expenses: {
        where: {
          OR: [
            { category: 'OIL_CHANGE' },
            { category: 'MAINTENANCE', description: { contains: 'vidange', mode: 'insensitive' } },
            { category: 'MAINTENANCE', description: { contains: 'huile', mode: 'insensitive' } },
            { category: 'MAINTENANCE', description: { contains: 'oil', mode: 'insensitive' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  for (const v of vehicles) {
    const intervals = getMaintenanceIntervals(v.brand, v.fuelType || 'GASOLINE');

    // Pas de vidange pour les électriques
    if (!intervals.oilChange) continue;

    const lastOilChange = v.expenses[0];
    const lastOilKm = lastOilChange?.mileage || 0;
    const kmSinceOil = v.mileage - lastOilKm;

    // Alerte quand on approche de 80% de l'intervalle
    const threshold = intervals.oilChange * 0.8;
    if (kmSinceOil < threshold) continue;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (await alertExists(v.userId, 'OIL_CHANGE', `${v.brand} ${v.model}`, { since: threeMonthsAgo })) continue;

    const kmLeft = Math.max(0, intervals.oilChange - kmSinceOil);
    await createAlert({
      title: `Vidange à prévoir : ${v.brand} ${v.model}`,
      message: kmLeft > 0
        ? `Vidange recommandée dans ~${kmLeft.toLocaleString('fr-FR')} km (intervalle ${intervals.oilChange.toLocaleString('fr-FR')} km pour ${v.brand}). Kilométrage actuel : ${v.mileage.toLocaleString('fr-FR')} km.`
        : `Vidange dépassée ! Dernière à ${lastOilKm.toLocaleString('fr-FR')} km, vous êtes à ${v.mileage.toLocaleString('fr-FR')} km (intervalle ${intervals.oilChange.toLocaleString('fr-FR')} km).`,
      type: 'OIL_CHANGE',
      userId: v.userId,
    });
    created++;
  }

  return created;
}

// ============================================================
// 4. Pneus été/hiver (saisonnier)
// ============================================================

async function checkTireSeason() {
  let created = 0;
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  // Périodes d'alerte :
  // Pneus hiver : alerte du 1er octobre au 15 novembre
  // Pneus été   : alerte du 1er mars au 15 avril
  let seasonMessage = null;
  let seasonTitle = null;

  if (month >= 10 && month <= 11) {
    seasonTitle = 'Pneus hiver';
    seasonMessage = 'La saison froide approche. Pensez à monter vos pneus hiver pour votre';
  } else if (month >= 3 && month <= 4) {
    seasonTitle = 'Pneus été';
    seasonMessage = 'Le printemps arrive. Pensez à remonter vos pneus été sur votre';
  }

  if (!seasonMessage) return 0;

  // Vérifier si l'utilisateur a déjà une dépense TIRES récente (< 2 mois)
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const vehicles = await prisma.vehicle.findMany({
    include: {
      expenses: {
        where: { category: 'TIRES', date: { gte: twoMonthsAgo } },
        take: 1,
      },
    },
  });

  for (const v of vehicles) {
    // Si l'utilisateur a changé ses pneus récemment, on skip
    if (v.expenses.length > 0) continue;

    // Électriques : pas de pneus saisonniers par défaut (pneus 4 saisons courants)
    if (v.fuelType === 'ELECTRIC') continue;

    if (await alertExists(v.userId, 'TIRE_SEASON', seasonTitle, { since: twoMonthsAgo })) continue;

    await createAlert({
      title: `${seasonTitle} : ${v.brand} ${v.model}`,
      message: `${seasonMessage} ${v.brand} ${v.model}. Les pneus adaptés améliorent l'adhérence et la sécurité.`,
      type: 'TIRE_SEASON',
      userId: v.userId,
    });
    created++;
  }

  return created;
}

// ============================================================
// 5. Alertes kilométrage (freins, distribution, révision générale)
// ============================================================

async function checkMileageService() {
  let created = 0;

  const vehicles = await prisma.vehicle.findMany({
    include: {
      expenses: {
        orderBy: { date: 'desc' },
      },
    },
  });

  for (const v of vehicles) {
    const intervals = getMaintenanceIntervals(v.brand, v.fuelType || 'GASOLINE');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // -- Freins --
    if (intervals.brakes) {
      const lastBrakeExp = v.expenses.find(e => e.category === 'BRAKES');
      const lastBrakeKm = lastBrakeExp?.mileage || 0;
      const kmSinceBrake = v.mileage - lastBrakeKm;

      if (kmSinceBrake >= intervals.brakes * 0.85) {
        if (!(await alertExists(v.userId, 'MILEAGE_SERVICE', `Freins`, { since: threeMonthsAgo }))) {
          const kmLeft = Math.max(0, intervals.brakes - kmSinceBrake);
          await createAlert({
            title: `Freins à vérifier : ${v.brand} ${v.model}`,
            message: kmLeft > 0
              ? `Vérification des plaquettes recommandée dans ~${kmLeft.toLocaleString('fr-FR')} km (seuil ${intervals.brakes.toLocaleString('fr-FR')} km).`
              : `Seuil de ${intervals.brakes.toLocaleString('fr-FR')} km dépassé pour les plaquettes de frein. Faites vérifier vos freins.`,
            type: 'MILEAGE_SERVICE',
            userId: v.userId,
          });
          created++;
        }
      }
    }

    // -- Courroie de distribution --
    if (intervals.timingBelt) {
      const lastBeltExp = v.expenses.find(e =>
        e.description && /courroie|distribution|timing|belt/i.test(e.description)
      );
      const lastBeltKm = lastBeltExp?.mileage || 0;
      const kmSinceBelt = v.mileage - lastBeltKm;

      if (kmSinceBelt >= intervals.timingBelt * 0.85) {
        if (!(await alertExists(v.userId, 'MILEAGE_SERVICE', `Courroie`, { since: threeMonthsAgo }))) {
          const kmLeft = Math.max(0, intervals.timingBelt - kmSinceBelt);
          await createAlert({
            title: `Courroie de distribution : ${v.brand} ${v.model}`,
            message: kmLeft > 0
              ? `Remplacement recommandé dans ~${kmLeft.toLocaleString('fr-FR')} km (seuil ${intervals.timingBelt.toLocaleString('fr-FR')} km).`
              : `Seuil de ${intervals.timingBelt.toLocaleString('fr-FR')} km atteint. Le remplacement de la courroie de distribution est urgent.`,
            type: 'MILEAGE_SERVICE',
            userId: v.userId,
          });
          created++;
        }
      }
    }

    // -- Révision générale par km --
    if (intervals.generalService) {
      const lastServiceExp = v.expenses.find(e => e.category === 'MAINTENANCE');
      const lastServiceKm = lastServiceExp?.mileage || 0;
      const kmSinceService = v.mileage - lastServiceKm;

      if (kmSinceService >= intervals.generalService * 0.85) {
        if (!(await alertExists(v.userId, 'MILEAGE_SERVICE', `Révision km`, { since: threeMonthsAgo }))) {
          const kmLeft = Math.max(0, intervals.generalService - kmSinceService);
          await createAlert({
            title: `Révision km : ${v.brand} ${v.model}`,
            message: kmLeft > 0
              ? `Révision recommandée dans ~${kmLeft.toLocaleString('fr-FR')} km (intervalle ${intervals.generalService.toLocaleString('fr-FR')} km pour ${v.brand}).`
              : `Intervalle de révision de ${intervals.generalService.toLocaleString('fr-FR')} km dépassé. Planifiez une révision pour votre ${v.brand} ${v.model}.`,
            type: 'MILEAGE_SERVICE',
            userId: v.userId,
          });
          created++;
        }
      }
    }
  }

  return created;
}

// ============================================================
// Orchestrateur principal
// ============================================================

async function runAllAlertChecks() {
  console.log('[CRON] Lancement vérification intelligente des alertes...');

  try {
    const docAlerts = await checkDocumentExpiry();
    const maintAlerts = await checkMaintenanceDue();
    const oilAlerts = await checkOilChange();
    const tireAlerts = await checkTireSeason();
    const kmAlerts = await checkMileageService();

    const total = docAlerts + maintAlerts + oilAlerts + tireAlerts + kmAlerts;
    console.log(`[CRON] ${total} alerte(s) créée(s) — Documents: ${docAlerts}, Révision: ${maintAlerts}, Vidange: ${oilAlerts}, Pneus: ${tireAlerts}, Km: ${kmAlerts}`);
  } catch (error) {
    console.error('[CRON] Erreur alertes :', error.message);
  }
}

/**
 * Démarrer le cron — toutes les 6 heures + exécution au boot
 */
function startAlertCron() {
  setTimeout(() => runAllAlertChecks(), 10_000);
  cron.schedule('0 */6 * * *', () => runAllAlertChecks());
  console.log('[CRON] Alertes intelligentes activées (toutes les 6h).');
}

module.exports = { startAlertCron, runAllAlertChecks };
