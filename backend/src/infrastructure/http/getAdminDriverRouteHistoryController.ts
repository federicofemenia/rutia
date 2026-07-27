import type { Request, Response } from 'express';
import type { GetAdminDriverRouteHistory } from '../../application/GetAdminDriverRouteHistory.js';

export function createGetAdminDriverRouteHistoryController(useCase: GetAdminDriverRouteHistory) {
  return async function getAdminDriverRouteHistoryController(req: Request, res: Response) {
    const { driverId } = req.params;

    if (typeof driverId !== 'string' || driverId.length === 0) {
      res.status(400).json({ error: 'Falta el id del chofer.' });
      return;
    }

    // `requesterCompanyId` sale siempre del token verificado (`req.auth`), nunca de params/query/body.
    const requesterCompanyId = req.auth?.companyId ?? null;

    try {
      const result = await useCase.execute({ driverId, requesterCompanyId });

      if (!result) {
        res.status(404).json({ error: 'No se encontró un chofer con ese id.' });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error al obtener el histórico de rutas del chofer', error);
      res.status(500).json({ error: 'No se pudo obtener el histórico de rutas.' });
    }
  };
}
