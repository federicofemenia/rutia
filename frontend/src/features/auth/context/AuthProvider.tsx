import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearLegacyRouteStorage } from '../../../shared/utils/legacyRouteStorage';
import { login as loginRequest } from '../api/login';
import type { AuthUser } from '../types';
import { clearStoredAuth, loadStoredAuth, saveStoredAuth } from '../utils/authStorage';
import { AuthContext, type AuthSession } from './authContextObject';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredAuth()?.user ?? null);

  // Limpieza de compatibilidad para instalaciones existentes: versiones previas guardaban la
  // RouteSession en una clave de localStorage global, sin scope de usuario — se borra una vez al
  // arrancar la app, aunque nadie haga login todavía.
  useEffect(() => {
    clearLegacyRouteStorage();
  }, []);

  const setSession = useCallback((session: AuthSession) => {
    saveStoredAuth(session);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (name: string, password: string) => {
      const result = await loginRequest(name, password);
      setSession(result);
    },
    [setSession],
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    clearLegacyRouteStorage();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, setSession, logout }), [user, login, setSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
