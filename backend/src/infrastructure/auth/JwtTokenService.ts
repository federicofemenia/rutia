import jwt from 'jsonwebtoken';
import type { AuthTokenPayload, TokenService } from '../../domain/TokenService.js';
import { UserRole } from '../../domain/UserRole.js';

const SESSION_TOKEN_EXPIRY = '12h';
/** Solo debe alcanzar para completar el paso 2 del registro público de choferes. */
const DRIVER_REGISTRATION_TOKEN_EXPIRY = '10m';

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (Object.values(UserRole) as string[]).includes(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

/**
 * Un token de sesión nunca puede colarse como token de registro (no tiene `companyId` de tipo
 * `string` sin `role`) ni viceversa (no tiene `userId`/`role`) — el `purpose` decide qué forma se
 * exige, así que un JWT robado/reusado para el propósito equivocado se rechaza acá, no río abajo.
 */
function toAuthTokenPayload(decoded: Record<string, unknown>): AuthTokenPayload | null {
  if (decoded.purpose === 'session') {
    const { userId, role, companyId } = decoded;

    if (typeof userId !== 'string' || !isUserRole(role) || !isNullableString(companyId)) {
      return null;
    }

    return { purpose: 'session', userId, role, companyId };
  }

  if (decoded.purpose === 'driver-registration') {
    const { companyId } = decoded;

    if (typeof companyId !== 'string') {
      return null;
    }

    return { purpose: 'driver-registration', companyId };
  }

  return null;
}

export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  sign(payload: AuthTokenPayload): string {
    const expiresIn = payload.purpose === 'session' ? SESSION_TOKEN_EXPIRY : DRIVER_REGISTRATION_TOKEN_EXPIRY;
    return jwt.sign(payload, this.secret, { expiresIn });
  }

  verify(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret);

      if (typeof decoded !== 'object' || decoded === null) {
        return null;
      }

      return toAuthTokenPayload(decoded as Record<string, unknown>);
    } catch {
      // Token inválido, mal formado o expirado — todos se tratan igual: no autenticado.
      return null;
    }
  }
}
