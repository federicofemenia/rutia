import type { UserRole } from './UserRole.js';

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

export interface TokenService {
  sign(payload: AuthTokenPayload): string;
  /** Devuelve el payload si el token es válido y no expiró; `null` en cualquier otro caso. */
  verify(token: string): AuthTokenPayload | null;
}
