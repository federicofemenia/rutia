import jwt from 'jsonwebtoken';
import type { AuthTokenPayload, TokenService } from '../../domain/TokenService.js';
import { UserRole } from '../../domain/UserRole.js';

const TOKEN_EXPIRY = '12h';

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (Object.values(UserRole) as string[]).includes(value);
}

export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  sign(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: TOKEN_EXPIRY });
  }

  verify(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret);

      if (typeof decoded !== 'object' || decoded === null) {
        return null;
      }

      const { userId, role } = decoded as Record<string, unknown>;

      if (typeof userId !== 'string' || !isUserRole(role)) {
        return null;
      }

      return { userId, role };
    } catch {
      // Token inválido, mal formado o expirado — todos se tratan igual: no autenticado.
      return null;
    }
  }
}
