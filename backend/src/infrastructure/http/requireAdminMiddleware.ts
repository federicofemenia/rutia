import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '../../domain/UserRole.js';

/** Se ejecuta después de `authMiddleware` — asume que `req.auth` ya está seteado. */
export function requireAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== UserRole.Admin) {
    res.status(403).json({ error: 'Esta acción requiere rol admin.' });
    return;
  }

  next();
}
