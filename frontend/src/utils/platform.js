import { isNativeCapacitor } from '../instrument';

/** Abonnements / Stripe : web uniquement (v1.0 iOS = 100 % gratuit, sans IAP). */
export function showPremiumUi() {
  return !isNativeCapacitor();
}
