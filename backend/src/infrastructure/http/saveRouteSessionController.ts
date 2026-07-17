import type { Request, Response } from 'express';
import type { SaveRouteSession } from '../../application/SaveRouteSession.js';
import type { RouteSession } from '../../domain/RouteSession.js';

function isRouteSessionLike(value: unknown): value is RouteSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as RouteSession;
  return (
    typeof session.id === 'string' &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string' &&
    Array.isArray(session.deliveries)
  );
}

export function createSaveRouteSessionController(useCase: SaveRouteSession) {
  return async function saveRouteSessionController(req: Request, res: Response) {
    if (!req.auth) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }

    if (!isRouteSessionLike(req.body)) {
      res.status(400).json({ error: 'El cuerpo debe ser una RouteSession válida (id, createdAt, updatedAt, deliveries).' });
      return;
    }

    try {
      await useCase.execute(req.auth.userId, req.body);
      res.status(204).send();
    } catch (error) {
      console.error('Error al guardar la ruta', error);
      res.status(500).json({ error: 'No se pudo guardar la ruta.' });
    }
  };
}
