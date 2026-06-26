import { useEffect, useState } from 'react';
import { PRICING } from '../constants/pricing';
import {
  getStorePricing,
  isPurchasesAvailable,
  mustUseAppleIap,
  SUBSCRIPTION_TITLE,
} from '../services/purchases';

function webPlan(plan, price, period) {
  return {
    title: SUBSCRIPTION_TITLE,
    priceString: `${price} €`,
    periodLabel: period,
    label: `${price} € / ${period}`,
  };
}

export function useSubscriptionPricing() {
  const useAppleIap = mustUseAppleIap();
  const shouldLoadStore = useAppleIap && isPurchasesAvailable();
  const [storePrices, setStorePrices] = useState(null);
  const [loading, setLoading] = useState(shouldLoadStore);

  useEffect(() => {
    if (!shouldLoadStore) return undefined;

    let cancelled = false;
    getStorePricing()
      .then((prices) => {
        if (!cancelled) setStorePrices(prices);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [shouldLoadStore]);

  const monthly = storePrices?.monthly || webPlan('monthly', PRICING.monthly, 'mois');
  const yearly = storePrices?.yearly || webPlan('yearly', PRICING.yearly, 'an');

  return {
    title: SUBSCRIPTION_TITLE,
    useAppleIap,
    loading,
    monthly,
    yearly,
    forPlan: (plan) => (plan === 'monthly' ? monthly : yearly),
  };
}
