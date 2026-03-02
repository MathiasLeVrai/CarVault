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
  REGISTRATION: 'Carte grise',
  OTHER: 'Autre',
};

/**
 * Variantes de badge pour les types de documents
 */
export const documentTypeBadge = {
  INSURANCE: 'sky',
  TECHNICAL_INSPECTION: 'orange',
  INVOICE: 'default',
  WARRANTY: 'lime',
  REGISTRATION: 'violet',
  OTHER: 'dark',
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
  MAINTENANCE: '#38bdf8', // sky
  TIRES: '#7c5cfc', // violet
  FUEL: '#ff6b00', // orange
  INSURANCE: '#a28dff', // violet-light
  REPAIR: '#ff2a3f', // accent (rose)
  PARKING: '#22c55e', // lime
  TOLL: '#ff6b7a', // accent-light
  OTHER: '#71717a', // ink-muted
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
