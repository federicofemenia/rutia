import { createContext } from 'react';
import type { AuthUser } from '../types';

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthContextValue {
  user: AuthUser | null;
  login: (name: string, password: string) => Promise<void>;
  /** Guarda una sesión ya obtenida (ej. tras un registro de chofer con auto-login). */
  setSession: (session: AuthSession) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
