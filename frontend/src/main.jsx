import './instrument'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { reactErrorHandler } from '@sentry/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.jsx'
import { isNativeCapacitor } from './instrument'
import './index.css'

const sentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN)
const rootOptions = sentryEnabled
  ? {
      onUncaughtError: reactErrorHandler(),
      onCaughtError: reactErrorHandler(),
      onRecoverableError: reactErrorHandler(),
    }
  : undefined

createRoot(document.getElementById('root'), rootOptions).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)

// ===== Enregistrement du Service Worker (PWA — prod uniquement) =====
if (import.meta.env.PROD && !isNativeCapacitor() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker enregistré:', reg.scope);
        setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch((err) => {
        console.log('[PWA] Erreur enregistrement SW:', err);
      });
  });
}

// ===== iOS PWA viewport fix =====
// Force recalcul viewport au retour du background (évite décalage / gap sur iOS standalone).
if (window.matchMedia('(display-mode: standalone)').matches) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestAnimationFrame(() => {
        window.scrollTo(0, 1);
        requestAnimationFrame(() => window.scrollTo(0, 0));
      });
    }
  });
}
