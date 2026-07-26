import type { AuthUser } from '../../auth';

export interface RegisterDriverInput {
  username: string;
  password: string;
  passwordConfirmation: string;
  registrationToken: string;
}

export interface RegisterDriverResult {
  token: string;
  user: AuthUser;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function registerDriver(input: RegisterDriverInput): Promise<RegisterDriverResult> {
  const response = await fetch(`${API_URL}/api/auth/register-driver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo completar el registro.');
  }

  return (await response.json()) as RegisterDriverResult;
}
