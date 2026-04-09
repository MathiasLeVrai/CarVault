const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { getMaintenanceIntervals } = require('../data/vehicles');
const { getBannedZones } = require('../data/zfe');
const { alertExists, createAlert } = require('./helpers');

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

    // CT gets earlier + more frequent warnings (amende = 135€)
    const isCT = doc.type === 'TECHNICAL_INSPECTION';
    const defaultThresholds = isCT ? [60, 30, 14, 7, 1] : [30, 7, 1];
    const thresholds = (doc.reminderDays?.length > 0 ? doc.reminderDays : defaultThresholds).sort((a, b) => b - a);
    const matchesThreshold = thresholds.some((p, i) => {
      const nextThreshold = thresholds[i + 1] || 0;
      return daysLeft <= p && daysLeft > nextThreshold;
    });
    if (!matchesThreshold) continue;

    const title = isCT
      ? `CT dans ${daysLeft}j : ${doc.vehicle.brand} ${doc.vehicle.model}`
      : `Expiration dans ${daysLeft}j : ${doc.name}`;
    const message = isCT
      ? `Votre contrôle technique expire le ${doc.expirationDate.toLocaleDateString('fr-FR')}. ${daysLeft <= 14 ? 'Prenez rendez-vous rapidement — rouler sans CT valide = 135€ d\'amende.' : 'Pensez à prendre rendez-vous pour éviter l\'amende de 135€.'}`
      : `Le document "${doc.name}" de votre ${doc.vehicle.brand} ${doc.vehicle.model} expire le ${doc.expirationDate.toLocaleDateString('fr-FR')}.`;

    const user = doc.vehicle.user;
    await createAlert({
      title,
      message,
      type: 'DOCUMENT_EXPIRY',
      dueDate: doc.expirationDate,
      userId: doc.vehicle.userId,
      emailSent: false,
    }, {
      email: user?.notifEmail !== false ? user?.email : null,
      userName: user?.firstName,
      dueDate: doc.expirationDate,
    });
    created++;
  }

  // Documents déjà expirés
  const expiredDocs = await prisma.document.findMany({
    where: { expirationDate: { lt: now } },
    include: { vehicle: { select: { id: true, brand: true, model: true, userId: true } } },
  });

  for (const doc of expiredDocs) {
    if (await alertExists(doc.vehicle.userId, 'DOCUMENT_EXPIRY', `Expiré`, { dueDate: doc.expirationDate })) continue;
    const isCT = doc.type === 'TECHNICAL_INSPECTION';
    await createAlert({
      title: isCT ? `CT EXPIRÉ : ${doc.vehicle.brand} ${doc.vehicle.model}` : `Expiré : ${doc.name}`,
      message: isCT
        ? `Votre contrôle technique a expiré le ${doc.expirationDate.toLocaleDateString('fr-FR')}. Vous risquez une amende de 135€ et une immobilisation du véhicule. Prenez rendez-vous immédiatement.`
        : `Le document "${doc.name}" de votre ${doc.vehicle.brand} ${doc.vehicle.model} a expiré le ${doc.expirationDate.toLocaleDateString('fr-FR')}. Pensez à le renouveler.`,
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
      user: { select: { email: true, firstName: true, notifEmail: true } },
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
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
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
      user: { select: { email: true, firstName: true, notifEmail: true } },
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
    const defaults = getMaintenanceIntervals(v.brand, v.fuelType || 'GASOLINE');
    const intervals = { ...defaults, ...(v.maintenanceConfig || {}) };
    const baselineMileage = v.purchaseMileage ?? v.mileage ?? 0;

    // Pas de vidange pour les électriques
    if (!intervals.oilChange) continue;

    const lastOilChange = v.expenses[0];
    const lastOilKm = lastOilChange?.mileage ?? baselineMileage;
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
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
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
      user: { select: { email: true, firstName: true, notifEmail: true } },
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
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
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
      user: { select: { email: true, firstName: true, notifEmail: true } },
      expenses: {
        orderBy: { date: 'desc' },
      },
    },
  });

  for (const v of vehicles) {
    const defaults = getMaintenanceIntervals(v.brand, v.fuelType || 'GASOLINE');
    const intervals = { ...defaults, ...(v.maintenanceConfig || {}) };
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const baselineMileage = v.purchaseMileage ?? v.mileage ?? 0;

    // -- Freins --
    if (intervals.brakes) {
      const lastBrakeExp = v.expenses.find(e => e.category === 'BRAKES');
      const lastBrakeKm = lastBrakeExp?.mileage ?? baselineMileage;
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
          }, {
            email: v.user?.notifEmail !== false ? v.user?.email : null,
            userName: v.user?.firstName,
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
      const lastBeltKm = lastBeltExp?.mileage ?? baselineMileage;
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
          }, {
            email: v.user?.notifEmail !== false ? v.user?.email : null,
            userName: v.user?.firstName,
          });
          created++;
        }
      }
    }

    // -- Révision générale par km --
    if (intervals.generalService) {
      const lastServiceExp = v.expenses.find(e => e.category === 'MAINTENANCE');
      const lastServiceKm = lastServiceExp?.mileage ?? baselineMileage;
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
          }, {
            email: v.user?.notifEmail !== false ? v.user?.email : null,
            userName: v.user?.firstName,
          });
          created++;
        }
      }
    }
  }

  return created;
}

// ============================================================
// 6. Restrictions ZFE (Crit'Air)
// ============================================================

async function checkZfeAlerts() {
  let created = 0;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const vehicles = await prisma.vehicle.findMany({
    where: { critAir: { not: null, gte: 2 } },
    include: {
      user: { select: { id: true, email: true, firstName: true, notifEmail: true } },
    },
  });

  for (const v of vehicles) {
    const banned = getBannedZones(v.critAir);
    if (banned.length === 0) continue;

    if (await alertExists(v.userId, 'ZFE_RESTRICTION', `ZFE`, { since: sixMonthsAgo })) continue;

    const cities = banned.slice(0, 5).map(z => z.city).join(', ');
    const more = banned.length > 5 ? ` et ${banned.length - 5} autre(s)` : '';

    await createAlert({
      title: `ZFE : ${v.brand} ${v.model} (Crit'Air ${v.critAir})`,
      message: `Votre ${v.brand} ${v.model} est Crit'Air ${v.critAir}. Ce vehicule est interdit de circulation dans les ZFE de ${cities}${more}. Verifiez les restrictions locales avant de circuler dans ces zones.`,
      type: 'ZFE_RESTRICTION',
      userId: v.userId,
    }, {
      email: v.user?.notifEmail !== false ? v.user?.email : null,
      userName: v.user?.firstName,
    });
    created++;
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
    const zfeAlerts = await checkZfeAlerts();

    const total = docAlerts + maintAlerts + oilAlerts + tireAlerts + kmAlerts + zfeAlerts;
    console.log(`[CRON] ${total} alerte(s) creee(s) — Documents: ${docAlerts}, Revision: ${maintAlerts}, Vidange: ${oilAlerts}, Pneus: ${tireAlerts}, Km: ${kmAlerts}, ZFE: ${zfeAlerts}`);
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
