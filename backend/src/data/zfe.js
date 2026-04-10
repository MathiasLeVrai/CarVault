/**
 * Zones a Faibles Emissions (ZFE) actives en France
 * Source : Ministere de la Transition ecologique (mars 2026)
 *
 * minCritAirBanned = vignette Crit'Air minimale INTERDITE dans la zone
 * Ex: minCritAirBanned=3 signifie que Crit'Air 3, 4, 5 et non classes sont interdits
 */

const ZFE_ZONES = [
  { city: 'Paris', minCritAirBanned: 3, since: '2022-06-01' },
  { city: 'Lyon', minCritAirBanned: 3, since: '2023-01-01' },
  { city: 'Marseille', minCritAirBanned: 3, since: '2023-09-01' },
  { city: 'Grenoble', minCritAirBanned: 3, since: '2023-07-01' },
  { city: 'Strasbourg', minCritAirBanned: 3, since: '2023-01-01' },
  { city: 'Toulouse', minCritAirBanned: 4, since: '2024-01-01' },
  { city: 'Rouen', minCritAirBanned: 4, since: '2023-09-01' },
  { city: 'Nice', minCritAirBanned: 4, since: '2023-01-01' },
  { city: 'Montpellier', minCritAirBanned: 4, since: '2023-07-01' },
  { city: 'Reims', minCritAirBanned: 4, since: '2024-01-01' },
  { city: 'Saint-Etienne', minCritAirBanned: 4, since: '2024-01-01' },
  { city: 'Aix-en-Provence', minCritAirBanned: 3, since: '2023-09-01' },
];

/**
 * Determine les zones ZFE ou un vehicule est interdit
 * @param {number} critAir - Niveau Crit'Air du vehicule (0-5)
 * @returns {Array} Liste des villes ou le vehicule est interdit
 */
function getBannedZones(critAir) {
  if (critAir == null || critAir <= 1) return [];
  return ZFE_ZONES.filter(z => critAir >= z.minCritAirBanned);
}

/**
 * Retourne le seuil le plus restrictif parmi toutes les ZFE
 */
function getMostRestrictiveThreshold() {
  return Math.min(...ZFE_ZONES.map(z => z.minCritAirBanned));
}

module.exports = { getBannedZones };
