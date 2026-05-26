import * as Sentry from '@sentry/react';
import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const dsn = import.meta.env.VITE_SENTRY_DSN;

export const isNativeCapacitor = () =>
  typeof window !== 'undefined' &&
  (window.Capacitor?.isNativePlatform?.() === true ||
    window.location.protocol === 'capacitor:');

if (!dsn) {
  // SDK désactivé sans DSN
} else {
  const isDev = import.meta.env.DEV;
  const native = isNativeCapacitor();

  const tracePropagationTargets = ['localhost', /^\/api/];
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      tracePropagationTargets.push(new URL(apiUrl).origin);
    } catch {
      /* URL invalide */
    }
  }

  const routerHooks = {
    useEffect: React.useEffect,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
  };

  const integrations = [];
  if (typeof Sentry.reactRouterV7BrowserTracingIntegration === 'function') {
    integrations.push(Sentry.reactRouterV7BrowserTracingIntegration(routerHooks));
  } else if (typeof Sentry.reactRouterV6BrowserTracingIntegration === 'function') {
    integrations.push(Sentry.reactRouterV6BrowserTracingIntegration(routerHooks));
  } else {
    integrations.push(Sentry.browserTracingIntegration());
  }

  if (!native) {
    integrations.push(
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    );
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    integrations,
    tracesSampleRate: isDev ? 1.0 : 0.1,
    tracePropagationTargets,
    replaysSessionSampleRate: native ? 0 : isDev ? 0.1 : 0.05,
    replaysOnErrorSampleRate: native ? 0 : 1.0,
    sendDefaultPii: false,
  });
}
