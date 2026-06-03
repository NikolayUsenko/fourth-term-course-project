import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { wsService } from '../services/websocket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: load user if tokens present
  useEffect(() => {
    const access = localStorage.getItem('access_token');
    if (access) {
      api.get('/auth/profile/')
        .then(res => {
          setUser(res.data);
          wsService.connect(access);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    const { access, refresh } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    const profile = await api.get('/auth/profile/');
    setUser(profile.data);
    wsService.connect(access);
    return profile.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await api.post('/auth/logout/', { refresh });
    } catch { }
    finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      wsService.disconnect();
    }
  }, []);

  const register = useCallback(async (data) => {
    await api.post('/auth/register/', data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}