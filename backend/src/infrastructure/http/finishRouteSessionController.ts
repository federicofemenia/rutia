import type { Request, Response } from 'express';
import type { FinishRouteSession, FinishRouteSessionFailureReason } from '../../application/FinishRouteSession.js';

const FAILURE_RESPONSES: Record<FinishRouteSessionFailureReason, { status: number; error: string }> = {
  'no-active-route': { status: 404, error: 'No hay una ruta guardada para este usuario.' },
  'deliveries-still-pending': { status: 409, error: 'Todavía hay entregas sin resolver en esta ruta.' },
};

export function createFinishRouteSessionController(useCase: FinishRouteSession) {
  return async function finishRouteSessionController(req: Request, res: Response) {
    if (!req.auth) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }

    try {
      const result = await useCase.execute(req.auth.userId);

      if (!result.success) {
        const { status, error } = FAILURE_RESPONSES[result.reason];
        res.status(status).json({ error });
        return;
      }

      res.status(200).json(result.session);
    } catch (error) {
      console.error('Error al finalizar la ruta', error);
      res.status(500).json({ error: 'No se pudo finalizar la ruta.' });
    }
  };
}
