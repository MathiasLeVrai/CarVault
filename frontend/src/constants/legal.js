export const CONTACT_EMAIL = 'contact@carvio.fr';
export const LEGAL_LAST_UPDATED = '26 juin 2026';

export const PRIVACY_PATH = '/privacy';
export const TERMS_PATH = '/terms';

export const PUBLIC_APP_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || 'https://carvio.fr'
).replace(/\/+$/, '');

export const getPrivacyUrl = () => `${PUBLIC_APP_URL}${PRIVACY_PATH}`;
export const getTermsUrl = () => `${PUBLIC_APP_URL}${TERMS_PATH}`;

export const IOS_SUBSCRIPTION_DISCLOSURE =
  "L'abonnement se renouvelle automatiquement sauf annulation au moins 24 h avant la fin de la période en cours. Le paiement est débité sur votre compte Apple à la confirmation. Gérez ou annulez l'abonnement dans Réglages > Apple ID > Abonnements.";
