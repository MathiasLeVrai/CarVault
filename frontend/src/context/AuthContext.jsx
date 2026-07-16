/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { authApi } from '../services/api';
import { isNativeCapacitor } from '../instrument';
import { configurePurchases, logoutPurchases, areIosSubscriptionsEnabled, isIosNative } from '../services/purchases';

const AuthContext = createContext(null);

const STORAGE_TOKEN = 'carvault_token';
const STORAGE_REFRESH = 'carvault_refresh_token';
const STORAGE_USER = 'carvault_user';

function persistSession(userData, token, refreshToken) {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
  if (isNativeCapacitor() && refreshToken) {
    localStorage.setItem(STORAGE_REFRESH, refreshToken);
  } else {
    localStorage.removeItem(STORAGE_REFRESH);
  }
}

function clearSessionStorage() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_REFRESH);
  localStorage.removeItem(STORAGE_USER);
}

export function AuthProvider({ children }) {
  // Optimistic: render immediately from localStorage (no loading spinner)
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem(STORAGE_TOKEN);
      const saved = localStorage.getItem(STORAGE_USER);
      if (token && saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  });
  useEffect(() => {
    if (import.meta.env.VITE_SENTRY_DSN) {
      if (user?.id) {
        Sentry.setUser({ id: String(user.id), email: user.email });
      } else {
        Sentry.setUser(null);
      }
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (!localStorage.getItem(STORAGE_TOKEN)) return;

    // Background validation — the API client auto-refreshes on 401
    authApi.getProfile()
      .then(profile => {
        if (cancelled) return;
        const serialized = JSON.stringify(profile);
        setUser(prev => {
          if (JSON.stringify(prev) === serialized) return prev;
          localStorage.setItem(STORAGE_USER, serialized);
          return profile;
        });
      })
      .catch((err) => {
        if (cancelled) return;
        // If we still get 401 after auto-refresh attempt, token is truly dead
        const status = err?.status;
        if (status === 401 || status === 403) {
          clearSessionStorage();
          setUser(null);
        }
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (isIosNative() && !areIosSubscriptionsEnabled()) return;
    configurePurchases(user.id).catch(() => {});
  }, [user?.id]);

  const login = async (email, password) => {
    const { user: userData, token, refreshToken } = await authApi.login({ email, password });
    persistSession(userData, token, refreshToken);
    setUser(userData);
    if (!isIosNative() || areIosSubscriptionsEnabled()) {
      await configurePurchases(userData.id).catch(() => {});
    }
    return userData;
  };

  const register = async (data) => {
    const { user: userData, token, refreshToken } = await authApi.register(data);
    persistSession(userData, token, refreshToken);
    setUser(userData);
    if (!isIosNative() || areIosSubscriptionsEnabled()) {
      await configurePurchases(userData.id).catch(() => {});
    }
    return userData;
  };

  const logout = () => {
    // Revoke refresh tokens server-side (best effort) — also clears HttpOnly cookie
    authApi.logout().catch(() => {});
    logoutPurchases().catch(() => {});
    clearSessionStorage();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      localStorage.setItem(STORAGE_USER, JSON.stringify(profile));
    } catch { /* ignore */ }
  };

  const updateProfile = async (formData) => {
    const updated = await authApi.updateProfile(formData);
    setUser(updated);
    localStorage.setItem(STORAGE_USER, JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
