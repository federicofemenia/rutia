import type { NextFunction, Request, Response } from 'express';
import type { AuthTokenPayload, TokenService } from '../../domain/TokenService.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
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

    if (!payload) {
      res.status(401).json({ error: 'Token inválido o expirado.' });
      return;
    }

    req.auth = payload;
    next();
  };
}
