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
  const d = new Date(date);
  if (!Number.isFinite(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formater une date courte
 */
export function formatDateShort(date) {
  const d = new Date(date);
  if (!Number.isFinite(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Labels pour les types de documents
 */
export const documentTypeLabels = {
  TECHNICAL_INSPECTION: 'Contrôle technique',
  INSURANCE: 'Assurance',
  REGISTRATION: 'Carte grise',
  INVOICE: 'Facture',
  ACCIDENT_REPORT: 'Constat amiable',
  WARRANTY: 'Garantie',
  OTHER: 'Autre',
};

/**
 * Variantes de badge pour les types de documents
 */
export const documentTypeBadge = {
  TECHNICAL_INSPECTION: 'orange',
  INSURANCE: 'sky',
  REGISTRATION: 'violet',
  INVOICE: 'default',
  ACCIDENT_REPORT: 'danger',
  WARRANTY: 'lime',
  OTHER: 'dark',
};

/**
 * Labels pour les catégories de dépenses
 */
export const expenseCategoryLabels = {
  MAINTENANCE: 'Entretien / Révision',
  OIL_CHANGE: 'Vidange',
  BRAKES: 'Freins / Plaquettes',
  TIRES: 'Pneus',
  BODYWORK: 'Carrosserie',
  WINDSHIELD: 'Pare-brise',
  TECHNICAL_INSPECTION: 'Contrôle technique',
  PARKING: 'Stationnement',
  TOLL: 'Péage',
  CLEANING: 'Lavage',
  FINE: 'Amende',
  OTHER: 'Autre',
};

/**
 * Couleurs pour les catégories de dépenses (Recharts)
 */
export const expenseCategoryColors = {
  MAINTENANCE: '#38bdf8',
  OIL_CHANGE: '#06b6d4',
  BRAKES: '#f43f5e',
  TIRES: '#7c5cfc',
  BODYWORK: '#f97316',
  WINDSHIELD: '#60a5fa',
  TECHNICAL_INSPECTION: '#ff6b00',
  PARKING: '#22c55e',
  TOLL: '#ff6b7a',
  CLEANING: '#0ea5e9',
  FINE: '#dc2626',
  OTHER: '#71717a',
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
  BUDGET_SPIKE: 'Pic de dépense',
  COST_PER_KM: 'Coût au km',
  FUEL_BUDGET_EXCEEDED: 'Budget carburant',
  KM_RECORD: 'Record km',
  CO2_MALUS: 'Malus CO2',
  FUEL_PRICE_DROP: 'Baisse carburant',
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
