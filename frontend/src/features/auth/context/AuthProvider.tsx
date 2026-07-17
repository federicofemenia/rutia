import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { login as loginRequest } from '../api/login';
import type { AuthUser } from '../types';
import { clearStoredAuth, loadStoredAuth, saveStoredAuth } from '../utils/authStorage';
import { AuthContext } from './authContextObject';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredAuth()?.user ?? null);

  const login = useCallback(async (name: string, password: string) => {
    const result = await loginRequest(name, password);
    saveStoredAuth(result);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
