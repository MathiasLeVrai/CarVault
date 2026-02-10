/**
 * Formater un montant en euros
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formater une date
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Formater une date courte
 */
export function formatDateShort(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Labels pour les types de documents
 */
export const documentTypeLabels = {
  INSURANCE: 'Assurance',
  TECHNICAL_INSPECTION: 'Contrôle technique',
  INVOICE: 'Facture',
  WARRANTY: 'Garantie',
  OTHER: 'Autre',
};

/**
 * Variantes de badge pour les types de documents
 */
export const documentTypeBadge = {
  INSURANCE: 'info',
  TECHNICAL_INSPECTION: 'warning',
  INVOICE: 'cyan',
  WARRANTY: 'success',
  OTHER: 'default',
};

/**
 * Labels pour les catégories de dépenses
 */
export const expenseCategoryLabels = {
  MAINTENANCE: 'Entretien',
  TIRES: 'Pneus',
  FUEL: 'Carburant',
  INSURANCE: 'Assurance',
  REPAIR: 'Réparation',
  PARKING: 'Stationnement',
  TOLL: 'Péage',
  OTHER: 'Autre',
};

/**
 * Couleurs pour les catégories de dépenses (Recharts)
 */
export const expenseCategoryColors = {
  MAINTENANCE: '#06b6d4',
  TIRES: '#8b5cf6',
  FUEL: '#f59e0b',
  INSURANCE: '#3b82f6',
  REPAIR: '#f87171',
  PARKING: '#34d399',
  TOLL: '#ec4899',
  OTHER: '#6b7280',
};

/**
 * Labels pour les types d'alertes
 */
export const alertTypeLabels = {
  DOCUMENT_EXPIRY: 'Expiration document',
  MAINTENANCE_DUE: 'Entretien à prévoir',
  INSPECTION_DUE: 'Contrôle technique',
  INSURANCE_RENEWAL: 'Renouvellement assurance',
  OIL_CHANGE: 'Vidange',
  TIRE_SEASON: 'Pneus saison',
  MILEAGE_SERVICE: 'Révision km',
  OTHER: 'Autre',
};

/**
 * Labels pour les types de carburant
 */
export const fuelTypeLabels = {
  GASOLINE: 'Essence',
  DIESEL: 'Diesel',
  HYBRID: 'Hybride',
  ELECTRIC: 'Électrique',
  LPG: 'GPL',
  OTHER: 'Autre',
};

/**
 * Jours restants avant une date
 */
export function daysUntil(date) {
  const now = new Date();
  const target = new Date(date);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
