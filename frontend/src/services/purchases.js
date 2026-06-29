import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

const ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID || 'premium';

export const SUBSCRIPTION_TITLE = 'Carvio Premium';

let configured = false;

export const isIosNative = () =>
  typeof window !== 'undefined' &&
  Capacitor.isNativePlatform() &&
  Capacitor.getPlatform() === 'ios';

/** Active les achats iOS (IAP). Désactivé par défaut — v1 App Store sans payant. */
export const areIosSubscriptionsEnabled = () =>
  import.meta.env.VITE_IOS_SUBSCRIPTIONS_ENABLED === 'true';

/** Afficher les écrans / boutons d'abonnement (web ou iOS si activé). */
export const shouldShowSubscriptions = () =>
  !isIosNative() || areIosSubscriptionsEnabled();

/** iOS App Store exige IAP — jamais Stripe côté client. */
export const mustUseAppleIap = () =>
  isIosNative() && areIosSubscriptionsEnabled();

export const isPurchasesAvailable = () =>
  mustUseAppleIap() && Boolean(import.meta.env.VITE_REVENUECAT_IOS_API_KEY);

function formatSubscriptionPeriod(period) {
  if (!period) return null;
  if (typeof period === 'object') {
    const unit = period.unit || period.subscriptionUnit;
    const value = period.value ?? period.numberOfUnits ?? 1;
    if (unit === 'YEAR' || unit === 'year') return value > 1 ? `${value} ans` : 'an';
    if (unit === 'MONTH' || unit === 'month') return value > 1 ? `${value} mois` : 'mois';
    if (unit === 'WEEK' || unit === 'week') return value > 1 ? `${value} semaines` : 'semaine';
  }
  const iso = String(period).toUpperCase();
  if (iso.includes('Y')) return 'an';
  if (iso.includes('M')) return 'mois';
  if (iso.includes('W')) return 'semaine';
  return null;
}

function formatPackage(pkg) {
  const product = pkg?.product;
  if (!product) return null;

  const periodLabel = formatSubscriptionPeriod(product.subscriptionPeriod);
  const priceString = product.priceString || product.localizedPriceString;

  return {
    title: product.title || SUBSCRIPTION_TITLE,
    priceString,
    periodLabel,
    label: priceString && periodLabel ? `${priceString} / ${periodLabel}` : priceString,
  };
}

export async function configurePurchases(userId) {
  if (!isPurchasesAvailable()) return false;

  const apiKey = import.meta.env.VITE_REVENUECAT_IOS_API_KEY;

  if (!configured) {
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
    await Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
    return true;
  }

  const { customerInfo } = await Purchases.logIn({ appUserID: userId });
  return Boolean(customerInfo);
}

export async function logoutPurchases() {
  if (!isPurchasesAvailable() || !configured) return;
  try {
    await Purchases.logOut();
  } catch {
    /* ignore — peut échouer si déjà anonyme */
  }
  configured = false;
}

function pickPackage(offering, plan) {
  if (!offering?.availablePackages?.length) return null;

  const targetType = plan === 'monthly' ? 'MONTHLY' : 'ANNUAL';
  const byType = offering.availablePackages.find((pkg) => pkg.packageType === targetType);
  if (byType) return byType;

  const byId = offering.availablePackages.find((pkg) =>
    plan === 'monthly'
      ? /month|mensuel/i.test(pkg.identifier)
      : /annual|year|annuel/i.test(pkg.identifier),
  );
  return byId || offering.availablePackages[0];
}

export async function purchaseSubscription(plan) {
  const { offerings } = await Purchases.getOfferings();
  const offering = offerings?.current;
  const selectedPackage = pickPackage(offering, plan);

  if (!selectedPackage) {
    throw new Error('Offre Premium indisponible. Réessayez plus tard.');
  }

  const { customerInfo } = await Purchases.purchasePackage({ aPackage: selectedPackage });
  return customerInfo;
}

export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export function hasPremiumEntitlement(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
}

export async function getCustomerInfo() {
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

export async function getStorePricing() {
  const { offerings } = await Purchases.getOfferings();
  const offering = offerings?.current;

  return {
    monthly: formatPackage(pickPackage(offering, 'monthly')),
    yearly: formatPackage(pickPackage(offering, 'yearly')),
  };
}

export function openAppleSubscriptionManagement() {
  window.open('https://apps.apple.com/account/subscriptions', '_system');
}
