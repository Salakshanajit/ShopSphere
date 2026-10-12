import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/shop';
import { getToken, setToken, setUnauthorizedHandler } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken())); // true while we verify a saved token

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // On first load: if a token is saved, ask the server who the user is.
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    authApi
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // If any request is rejected with 401 (e.g. the token expired), end the session.
  useEffect(() => {
    setUnauthorizedHandler((error) => {
      logout();
      toast.error(error.message || 'Your session has expired. Please log in again.');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, toast]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await authApi.register({ name, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'ADMIN', login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
