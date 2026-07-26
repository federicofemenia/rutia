import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../domain/UserRole.js';

/** Se ejecuta después de `authMiddleware` — asume que `req.auth` ya está seteado. */
export function requireRole(...allowedRoles: UserRole[]) {
  return function requireRoleMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
      return;
    }

    next();
  };
}
