import type { Request, Response } from 'express';
import type { GetDriverRouteHistoryDetail } from '../../application/GetDriverRouteHistoryDetail.js';

export function createGetDriverRouteHistoryDetailController(useCase: GetDriverRouteHistoryDetail) {
  return async function getDriverRouteHistoryDetailController(req: Request, res: Response) {
    if (!req.auth) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }

    const { id } = req.params;

    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({ error: 'Falta el id de la ruta.' });
      return;
    }

    try {
      const entry = await useCase.execute(id, req.auth.userId);

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
