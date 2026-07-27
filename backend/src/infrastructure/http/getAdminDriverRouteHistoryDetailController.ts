import type { Request, Response } from 'express';
import type { GetAdminDriverRouteHistoryDetail } from '../../application/GetAdminDriverRouteHistoryDetail.js';

export function createGetAdminDriverRouteHistoryDetailController(useCase: GetAdminDriverRouteHistoryDetail) {
  return async function getAdminDriverRouteHistoryDetailController(req: Request, res: Response) {
    const { driverId, id } = req.params;

    if (typeof driverId !== 'string' || driverId.length === 0 || typeof id !== 'string' || id.length === 0) {
      res.status(400).json({ error: 'Falta el id del chofer o de la ruta.' });
      return;
    }

    // `requesterCompanyId` sale siempre del token verificado (`req.auth`), nunca de params/query/body.
    const requesterCompanyId = req.auth?.companyId ?? null;

    try {
      const entry = await useCase.execute({ driverId, entryId: id, requesterCompanyId });

      if (!entry) {
        res.status(404).json({ error: 'No se encontró esa ruta en el histórico.' });
        return;
      }

      res.status(200).json(entry);
    } catch (error) {
      console.error('Error al obtener el detalle del histórico de rutas del chofer', error);
      res.status(500).json({ error: 'No se pudo obtener el detalle de la ruta.' });
    }
  };
}
