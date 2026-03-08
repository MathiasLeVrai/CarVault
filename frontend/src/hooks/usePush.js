import { useState, useEffect, useCallback } from 'react';
import { pushApi } from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function usePush() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(ok);
    if (!ok) { setLoading(false); return; }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
      setLoading(false);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    setLoading(true);
    try {
      const { key } = await pushApi.getVapidKey();
      if (!key) { setLoading(false); return false; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      await pushApi.subscribe(sub.toJSON());
      setSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [supported]);

  return { supported, subscribed, loading, subscribe, unsubscribe };
}
