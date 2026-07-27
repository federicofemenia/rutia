import type { Request, Response } from 'express';
import type { GetDriverRouteHistory } from '../../application/GetDriverRouteHistory.js';

export function createGetDriverRouteHistoryController(useCase: GetDriverRouteHistory) {
  return async function getDriverRouteHistoryController(req: Request, res: Response) {
    if (!req.auth) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }

    try {
      const history = await useCase.execute(req.auth.userId);
      res.status(200).json({ history });
    } catch (error) {
      console.error('Error al obtener el histórico de rutas del chofer', error);
      res.status(500).json({ error: 'No se pudo obtener el histórico de rutas.' });
    }
  };
}
