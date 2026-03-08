/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('carvault_token');
    const savedUser = localStorage.getItem('carvault_user');

    if (token && savedUser) {
      // On a un token — on tente de valider avec l'API
      authApi.getProfile()
        .then(profile => {
          setUser(profile);
          localStorage.setItem('carvault_user', JSON.stringify(profile));
        })
        .catch(() => {
          // Token invalide ou expiré — on nettoie tout
          localStorage.removeItem('carvault_token');
          localStorage.removeItem('carvault_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      // Pas de token — on affiche directement le login
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { user: userData, token } = await authApi.login({ email, password });
    localStorage.setItem('carvault_token', token);
    localStorage.setItem('carvault_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const { user: userData, token } = await authApi.register(data);
    localStorage.setItem('carvault_token', token);
    localStorage.setItem('carvault_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('carvault_token');
    localStorage.removeItem('carvault_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      localStorage.setItem('carvault_user', JSON.stringify(profile));
    } catch { /* ignore */ }
  };

  const updateProfile = async (formData) => {
    const updated = await authApi.updateProfile(formData);
    setUser(updated);
    localStorage.setItem('carvault_user', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, updateProfile }}>
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
