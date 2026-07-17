import type { AuthUser } from '../types';

const STORAGE_KEY = 'rutia:auth';

export interface StoredAuth {
  token: string;
  user: AuthUser;
}

export function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // localStorage puede fallar por cuota excedida o modo privado (Safari) — se degrada a solo memoria.
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op: si falla borrar, no hay una acción segura adicional que tomar.
  }
}

export function getStoredToken(): string | null {
  return loadStoredAuth()?.token ?? null;
}
