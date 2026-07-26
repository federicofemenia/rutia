import type { UserRole } from './UserRole.js';

export interface SessionTokenPayload {
  purpose: 'session';
  userId: string;
  role: UserRole;
  companyId: string | null;
}

/** Token temporal de corta duración emitido tras validar un código de registro de empresa. */
export interface DriverRegistrationTokenPayload {
  purpose: 'driver-registration';
  companyId: string;
}

export type AuthTokenPayload = SessionTokenPayload | DriverRegistrationTokenPayload;

export interface TokenService {
  sign(payload: AuthTokenPayload): string;
  /** Devuelve el payload si el token es válido y no expiró; `null` en cualquier otro caso. */
  verify(token: string): AuthTokenPayload | null;
}
