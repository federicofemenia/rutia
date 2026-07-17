import type { AuthUser } from '../types';

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export async function login(name: string, password: string): Promise<LoginResult> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo iniciar sesión.');
  }

  return (await response.json()) as LoginResult;
}
