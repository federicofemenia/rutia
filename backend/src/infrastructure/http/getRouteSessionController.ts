import type { Request, Response } from 'express';
import type { GetRouteSession } from '../../application/GetRouteSession.js';

export function createGetRouteSessionController(useCase: GetRouteSession) {
  return async function getRouteSessionController(req: Request, res: Response) {
    if (!req.auth) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }

    try {
      const session = await useCase.execute(req.auth.userId);

      if (!session) {
        res.status(404).json({ error: 'No hay una ruta guardada para este usuario.' });
        return;
      }

      res.status(200).json(session);
    } catch (error) {
      console.error('Error al leer la ruta', error);
      res.status(500).json({ error: 'No se pudo obtener la ruta.' });
    }
  };
}
