import type { NextFunction, Request, Response } from 'express';
import type { SessionTokenPayload, TokenService } from '../../domain/TokenService.js';

declare global {
  namespace Express {
    interface Request {
      auth?: SessionTokenPayload;
    }
  }
}

export function createAuthMiddleware(tokenService: TokenService) {
  return function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

    if (!token) {
      res.status(401).json({ error: 'Falta el token de autenticación.' });
      return;
    }

    const payload = tokenService.verify(token);

    // Un token de registro de chofer (`purpose: 'driver-registration'`) nunca es válido acá —
    // solo se usa dentro del body de POST /api/auth/register-driver, nunca como Bearer token.
    if (!payload || payload.purpose !== 'session') {
      res.status(401).json({ error: 'Token inválido o expirado.' });
      return;
    }

    req.auth = payload;
    next();
  };
}
