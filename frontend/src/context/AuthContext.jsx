/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_TOKEN = 'carvault_token';
const STORAGE_USER = 'carvault_user';

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
    let cancelled = false;
    if (!localStorage.getItem(STORAGE_TOKEN)) return;

    // Background validation — don't block render, but logout if token invalid
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
        // Only clear on auth errors (401/403), not network failures
        const status = err?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem(STORAGE_TOKEN);
          localStorage.removeItem(STORAGE_USER);
          setUser(null);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const login = async (email, password) => {
    const { user: userData, token } = await authApi.login({ email, password });
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const { user: userData, token } = await authApi.register(data);
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
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
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
