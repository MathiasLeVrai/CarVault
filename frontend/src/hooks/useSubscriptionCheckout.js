import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { subscriptionApi } from '../services/api';
import {
  isPurchasesAvailable,
  mustUseAppleIap,
  purchaseSubscription,
  restorePurchases,
} from '../services/purchases';

function isUserCancelled(error) {
  return error?.userCancelled === true
    || error?.code === 'PURCHASE_CANCELLED'
    || /cancel/i.test(error?.message || '');
}

export function useSubscriptionCheckout() {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { refreshUser } = useAuth();
  const toast = useToast();
  const useAppleIap = mustUseAppleIap();

  const subscribe = useCallback(async (plan = 'yearly') => {
    setLoading(true);
    try {
      if (useAppleIap) {
        if (!isPurchasesAvailable()) {
          throw new Error('Les achats intégrés ne sont pas disponibles. Réessayez plus tard.');
        }
        await purchaseSubscription(plan);
        await subscriptionApi.syncApple();
        await refreshUser();
        toast.success('Bienvenue dans Premium !');
        return { success: true };
      }

      const { url } = await subscriptionApi.createCheckout(plan);
      if (url) {
        window.location.href = url;
        return { success: true, redirected: true };
      }

      toast.info('Contactez contact@carvio.fr pour activer Premium.');
      return { success: false };
    } catch (err) {
      if (isUserCancelled(err)) return { success: false, cancelled: true };
      toast.error(err.message || 'Erreur lors du paiement');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [refreshUser, toast, useAppleIap]);

  const restore = useCallback(async () => {
    if (!useAppleIap || !isPurchasesAvailable()) return { success: false };
    setRestoring(true);
    try {
      await restorePurchases();
      await subscriptionApi.syncApple();
      await refreshUser();
      toast.success('Achats restaurés.');
      return { success: true };
    } catch (err) {
      toast.error(err.message || 'Impossible de restaurer les achats');
      return { success: false };
    } finally {
      setRestoring(false);
    }
  }, [refreshUser, toast, useAppleIap]);

  return {
    subscribe,
    restore,
    loading,
    restoring,
    useAppleIap,
  };
}
