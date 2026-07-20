import { useState, useEffect, useCallback, useRef } from 'react';
import { pushApi } from '../services/api';
import { isNativeCapacitor } from '../instrument';

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
  const nativeTokenRef = useRef(null);

  const native = isNativeCapacitor();

  useEffect(() => {
    let cleanup = () => {};

    if (native) {
      setSupported(true);
      (async () => {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const perm = await PushNotifications.checkPermissions();
          setSubscribed(perm.receive === 'granted');

          const regHandle = await PushNotifications.addListener('registration', async (token) => {
            nativeTokenRef.current = token.value;
            try {
              await pushApi.nativeSubscribe(token.value, 'IOS');
              setSubscribed(true);
            } catch { /* best-effort */ }
          });

          const actionHandle = await PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (action) => {
              const url = action?.notification?.data?.url;
              if (url) window.location.href = url;
            },
          );

          cleanup = () => { regHandle.remove(); actionHandle.remove(); };
        } catch {
          setSupported(false);
        } finally {
          setLoading(false);
        }
      })();

      return () => cleanup();
    }

    const ok = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(ok);
    if (!ok) { setLoading(false); return; }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
      setLoading(false);
    });

    return () => cleanup();
  }, [native]);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    setLoading(true);
    try {
      if (native) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') return false;
        // 'registration' listener posts the token to the backend.
        await PushNotifications.register();
        return true;
      }

      const { key } = await pushApi.getVapidKey();
      if (!key) return false;

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
  }, [supported, native]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      if (native) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        try { await PushNotifications.unregister(); } catch { /* ignore */ }
        if (nativeTokenRef.current) {
          try { await pushApi.nativeUnsubscribe(nativeTokenRef.current); } catch { /* ignore */ }
        }
        setSubscribed(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [supported, native]);

  return { supported, subscribed, loading, subscribe, unsubscribe };
}
