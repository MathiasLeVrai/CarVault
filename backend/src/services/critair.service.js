/**
 * Service de calcul de la vignette Crit'Air
 * Basé sur les règles officielles françaises (arrêté du 21 juin 2016)
 *
 * Résultat : 0 (électrique/hydrogène) à 5 (plus polluant), ou null si inconnu
 */

/**
 * Calcule la vignette Crit'Air d'un véhicule
 * @param {string} fuelType - GASOLINE, DIESEL, HYBRID, ELECTRIC, LPG, OTHER
 * @param {Date|string|null} firstRegistrationDate - Date de première immatriculation
 * @returns {number|null} 0-5 ou null si impossible à déterminer
 */
function computeCritAir(fuelType, firstRegistrationDate) {
  if (!fuelType) return null;

  const fuel = fuelType.toUpperCase();

  // Électrique et hydrogène → toujours 0
  if (fuel === 'ELECTRIC') return 0;

  // Si pas de date, on ne peut pas déterminer la norme Euro
  if (!firstRegistrationDate) return null;

  const regDate = new Date(firstRegistrationDate);
  if (isNaN(regDate.getTime())) return null;

  const year = regDate.getFullYear();
  const month = regDate.getMonth() + 1;
  // Date décimale pour les seuils intermédiaires
  const dateNum = year + (month - 1) / 12;

  // Hybride rechargeable → Crit'Air 1
  if (fuel === 'HYBRID') return 1;

  // GPL / GNV
  if (fuel === 'LPG') {
    if (dateNum >= 2011) return 1;
    if (dateNum >= 2006) return 2;
    if (dateNum >= 1997) return 3;
    return null; // Trop ancien → non classé (interdit)
  }

  // Essence (et assimilé)
  if (fuel === 'GASOLINE' || fuel === 'OTHER') {
    // Euro 5-6 (depuis 01/2011) → Crit'Air 1
    if (dateNum >= 2011) return 1;
    // Euro 4 (01/2006 - 12/2010) → Crit'Air 2
    if (dateNum >= 2006) return 2;
    // Euro 2-3 (01/1997 - 12/2005) → Crit'Air 3
    if (dateNum >= 1997) return 3;
    // Avant 1997 → non classé (Crit'Air 5 dans la pratique)
    return 5;
  }

  // Diesel
  if (fuel === 'DIESEL') {
    // Euro 6 (depuis 01/2011 pour VP, affiné à 09/2015 pour Euro 6b)
    // Simplifié : 2011+ → Crit'Air 2
    if (dateNum >= 2011) return 2;
    // Euro 4 (01/2006 - 12/2010) → Crit'Air 3
    if (dateNum >= 2006) return 3;
    // Euro 3 (01/2001 - 12/2005) → Crit'Air 4
    if (dateNum >= 2001) return 4;
    // Euro 1-2 (avant 2001) → Crit'Air 5
    if (year >= 1997) return 5;
    // Avant 1997 → non classé
    return null;
  }

  return null;
}

module.exports = { computeCritAir };
